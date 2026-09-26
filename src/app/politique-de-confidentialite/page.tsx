import type { Metadata } from "next";
import { A, LegalPage, P, Ul } from "@/components/legal/LegalPage";
import { CNIL, HOST } from "@/lib/legal-info";
import { getLegalContext } from "@/lib/server/legal";

export const metadata: Metadata = { title: "Politique de confidentialité", description: "Comment les Dames du Parc protègent et utilisent vos données personnelles, et comment exercer vos droits (RGPD)." };

const row = "border-b border-white/10 align-top";
const th = "py-2 pr-4 text-left font-body text-[12px] font-semibold uppercase tracking-[0.14em] text-mist";
const td = "py-3 pr-4 text-white/80 t-small";

export default async function PrivacyPage() {
  const { a, v, fullAddress, retentionMonths } = await getLegalContext();
  return (
    <LegalPage
      eyebrow="Vos données"
      title="Politique de confidentialité"
      intro={<P>Cette politique explique quelles données personnelles {a.name} collecte, pourquoi, combien de temps elles sont conservées et comment vous pouvez exercer vos droits, conformément au Règlement général sur la protection des données (RGPD) et à la loi Informatique et Libertés.</P>}
      sections={[
        {
          id: "responsable",
          title: "Responsable du traitement",
          body: (
            <>
              <P>{v(a.legalName || a.name)} ({v(a.form)}), {fullAddress}. Contact pour toute question relative aux données personnelles : {v(a.email)}.</P>
              <P>L&rsquo;association n&rsquo;a pas désigné de délégué à la protection des données (DPO), le traitement n&rsquo;étant pas à grande échelle ; le contact ci-dessus répond à toutes les demandes.</P>
            </>
          ),
        },
        {
          id: "donnees",
          title: "Données collectées",
          body: (
            <Ul>
              <li><strong className="text-white">Adhésion et compte :</strong> nom, prénom, date de naissance, adresse e-mail, téléphone, adresse postale, mot de passe (conservé uniquement sous forme chiffrée irréversible), numéro de membre, formule, consentements donnés.</li>
              <li><strong className="text-white">Mineures :</strong> coordonnées du représentant légal et autorisation parentale (fichier PDF déposé).</li>
              <li><strong className="text-white">Événements :</strong> identité, coordonnées, contact d&rsquo;urgence, nombre de places et, si vous les indiquez, allergies ou remarques. Ces informations facultatives peuvent relever de la santé : elles ne sont demandées que pour votre sécurité et ne sont utilisées que pour l&rsquo;événement.</li>
              <li><strong className="text-white">Boutique :</strong> contact, adresse de livraison, contenu et montant de la commande. Les paiements sont traités par HelloAsso : l&rsquo;association ne reçoit ni ne conserve aucun numéro de carte bancaire.</li>
              <li><strong className="text-white">Sécurité :</strong> adresse IP, date et navigateur lors des connexions (journal de sécurité) ; nombre de pages vues sans identification de la personne.</li>
              <li><strong className="text-white">Communication :</strong> historique des e-mails envoyés par le site (confirmations, rappels, messages de l&rsquo;équipe).</li>
              <li><strong className="text-white">Demandes RGPD :</strong> les informations que vous transmettez pour exercer vos droits.</li>
            </Ul>
          ),
        },
        {
          id: "finalites",
          title: "Pourquoi vos données sont utilisées",
          body: (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse">
                <thead><tr className="border-b border-white/15"><th className={th}>Finalité</th><th className={th}>Base légale</th></tr></thead>
                <tbody>
                  <tr className={row}><td className={td}>Gérer l&rsquo;adhésion, la carte de membre, votre espace personnel</td><td className={td}>Exécution du contrat d&rsquo;adhésion</td></tr>
                  <tr className={row}><td className={td}>Gérer les inscriptions aux événements, listes de présence, sécurité des participantes</td><td className={td}>Exécution du contrat ; intérêt légitime (sécurité)</td></tr>
                  <tr className={row}><td className={td}>Traiter et livrer les commandes, encaisser les paiements, tenir la comptabilité</td><td className={td}>Exécution du contrat ; obligation légale (comptabilité)</td></tr>
                  <tr className={row}><td className={td}>Envoyer les messages liés à votre adhésion, vos commandes et vos événements</td><td className={td}>Exécution du contrat</td></tr>
                  <tr className={row}><td className={td}>Envoyer des informations et actualités du groupe</td><td className={td}>Consentement (retirable à tout moment)</td></tr>
                  <tr className={row}><td className={td}>Diffuser des photographies ou vidéos où vous êtes reconnaissable</td><td className={td}>Consentement (retirable à tout moment)</td></tr>
                  <tr className={row}><td className={td}>Protéger le site (limitation des tentatives, journal de connexion, détection d&rsquo;abus)</td><td className={td}>Intérêt légitime</td></tr>
                  <tr className={row}><td className={td}>Répondre à vos demandes d&rsquo;exercice de droits</td><td className={td}>Obligation légale</td></tr>
                </tbody>
              </table>
            </div>
          ),
        },
        {
          id: "destinataires",
          title: "Qui a accès à vos données",
          body: (
            <>
              <Ul>
                <li><strong className="text-white">L&rsquo;équipe de l&rsquo;association</strong>, uniquement les personnes habilitées et dans la limite de leur rôle (accès contrôlé, double authentification obligatoire, journal d&rsquo;activité).</li>
                <li><strong className="text-white">{HOST.name}</strong>, hébergeur du site et de la base de données, en Suisse ({HOST.address}). La Suisse bénéficie d&rsquo;une décision d&rsquo;adéquation de la Commission européenne.</li>
                <li><strong className="text-white">HelloAsso</strong>, plateforme de paiement des associations, pour les paiements en ligne.</li>
                <li><strong className="text-white">Le prestataire d&rsquo;envoi d&rsquo;e-mails</strong> utilisé par le site (Resend), pour l&rsquo;envoi des messages ; ses transferts hors Union européenne sont encadrés par des clauses contractuelles types.</li>
                <li>Les autorités, lorsque la loi l&rsquo;impose.</li>
              </Ul>
              <P>Vos données ne sont ni vendues ni cédées à des fins commerciales.</P>
            </>
          ),
        },
        {
          id: "conservation",
          title: "Durées de conservation",
          body: (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse">
                <thead><tr className="border-b border-white/15"><th className={th}>Données</th><th className={th}>Durée</th></tr></thead>
                <tbody>
                  <tr className={row}><td className={td}>Compte et fiche adhérente</td><td className={td}>Durée de l&rsquo;adhésion, puis {retentionMonths} mois après la dernière activité, sauf demande d&rsquo;effacement</td></tr>
                  <tr className={row}><td className={td}>Autorisation parentale (PDF)</td><td className={td}>Jusqu&rsquo;à la fin de l&rsquo;adhésion ou à l&rsquo;effacement du compte</td></tr>
                  <tr className={row}><td className={td}>Pièces comptables (commandes, paiements)</td><td className={td}>10 ans (obligation légale), sous forme anonymisée lorsque la personne demande l&rsquo;effacement</td></tr>
                  <tr className={row}><td className={td}>Inscriptions aux événements</td><td className={td}>Jusqu&rsquo;à 3 ans après l&rsquo;événement</td></tr>
                  <tr className={row}><td className={td}>Journal de connexion (adresse IP)</td><td className={td}>90 jours</td></tr>
                  <tr className={row}><td className={td}>Historique des e-mails envoyés</td><td className={td}>12 mois</td></tr>
                  <tr className={row}><td className={td}>Demandes d&rsquo;exercice de droits</td><td className={td}>3 ans après leur clôture</td></tr>
                </tbody>
              </table>
            </div>
          ),
        },
        {
          id: "securite",
          title: "Sécurité",
          body: <P>Le site utilise le chiffrement HTTPS ; les mots de passe sont conservés sous forme chiffrée irréversible ; les sessions sont protégées ; l&rsquo;accès d&rsquo;administration exige une double authentification ; les actions sensibles (exports, effacements, remboursements) exigent une confirmation d&rsquo;identité et sont journalisées ; les fichiers personnels ne sont accessibles qu&rsquo;à leur titulaire et aux personnes habilitées. En cas de violation de données présentant un risque, l&rsquo;association informe la CNIL et les personnes concernées dans les conditions prévues par la loi.</P>,
        },
        {
          id: "mineures",
          title: "Mineures",
          body: <P>Les adhérentes mineures s&rsquo;inscrivent avec l&rsquo;autorisation de leur représentant légal, qui peut exercer leurs droits en leur nom.</P>,
        },
        {
          id: "vos-droits",
          title: "Vos droits",
          body: (
            <>
              <Ul>
                <li><strong className="text-white">Accès :</strong> obtenir une copie des données vous concernant.</li>
                <li><strong className="text-white">Rectification :</strong> faire corriger des données inexactes ou incomplètes.</li>
                <li><strong className="text-white">Effacement :</strong> demander la suppression de vos données (« droit à l&rsquo;oubli »), sauf celles que la loi oblige à conserver, qui sont alors anonymisées.</li>
                <li><strong className="text-white">Limitation et opposition :</strong> demander la suspension d&rsquo;un traitement ou vous y opposer pour des raisons tenant à votre situation.</li>
                <li><strong className="text-white">Portabilité :</strong> recevoir vos données dans un format structuré et lisible par machine.</li>
                <li><strong className="text-white">Retrait du consentement</strong> à tout moment, sans effet sur ce qui a été fait avant.</li>
                <li><strong className="text-white">Directives</strong> sur le sort de vos données après votre décès.</li>
              </Ul>
              <P><strong className="text-white">Comment les exercer :</strong> depuis la page <A href="/mes-donnees">Mes données</A> (formulaire ouvert à tous, et, pour les adhérentes connectées, téléchargement de leurs données et suppression immédiate de leur compte), ou par e-mail à {v(a.email)}. L&rsquo;association répond dans un délai d&rsquo;un mois maximum. Un justificatif d&rsquo;identité peut être demandé en cas de doute raisonnable.</P>
              <P>Si vous estimez, après nous avoir contactés, que vos droits ne sont pas respectés, vous pouvez introduire une réclamation auprès de la {CNIL.name}, {CNIL.address} — <A href={CNIL.site}>{CNIL.site.replace("https://www.", "")}</A>.</P>
            </>
          ),
        },
        {
          id: "cookies",
          title: "Cookies",
          body: <P>Le site ne dépose aucun cookie de mesure d&rsquo;audience ni de publicité. Le détail figure dans la <A href="/politique-de-cookies">politique de cookies</A>.</P>,
        },
        {
          id: "modifications",
          title: "Modification de cette politique",
          body: <P>Cette politique peut évoluer, notamment si les traitements changent. La date de dernière mise à jour figure en haut de la page.</P>,
        },
      ]}
    />
  );
}
