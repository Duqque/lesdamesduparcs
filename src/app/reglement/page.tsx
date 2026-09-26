import type { Metadata } from "next";
import { A, LegalPage, P, Ul } from "@/components/legal/LegalPage";
import { getLegalContext } from "@/lib/server/legal";

export const metadata: Metadata = { title: "Règlement", description: "Règlement intérieur des Dames du Parc : adhésion, carte de membre, comportement, événements, image, sanctions." };

export default async function ReglementPage() {
  const { a, v } = await getLegalContext();
  return (
    <LegalPage
      eyebrow="Vie du groupe"
      title="Règlement"
      intro={<P>Ce règlement s&rsquo;applique à toutes les adhérentes de {a.name} et à toute personne qui participe à ses événements. Il complète les statuts de l&rsquo;association ({v(a.legalName || a.name)}). En adhérant, chacune s&rsquo;engage à le respecter.</P>}
      sections={[
        {
          id: "objet",
          title: "Objet",
          body: <P>{a.name} réunit des supportrices du Paris Saint-Germain autour de la passion du club, de la rencontre et de l&rsquo;entraide. Le groupe est ouvert à toutes les supportrices qui partagent ses valeurs : passion, fidélité, bienveillance, sororité, transmission et engagement.</P>,
        },
        {
          id: "adhesion",
          title: "Adhésion",
          body: (
            <>
              <Ul>
                <li>L&rsquo;adhésion se fait en ligne, sur la page <A href="/rejoindre-le-groupe/inscription">Devenir membre</A>, ou auprès de l&rsquo;équipe, par saison (du 1er septembre au 31 août).</li>
                <li>Elle est personnelle et nominative. Les informations fournies doivent être exactes et tenues à jour.</li>
                <li>Les mineures peuvent adhérer avec l&rsquo;autorisation écrite de leur représentant légal (document à déposer lors de l&rsquo;inscription).</li>
                <li>La cotisation est fixée pour la saison par la formule choisie. Elle est due pour toute la saison et n&rsquo;est pas remboursable, sauf décision exceptionnelle du bureau.</li>
              </Ul>
            </>
          ),
        },
        {
          id: "carte",
          title: "Carte de membre",
          body: <P>La carte de membre (numéro, QR code, attestation) est strictement personnelle : elle ne peut être ni prêtée, ni cédée, ni copiée. Le QR code permet à l&rsquo;association de vérifier une adhésion. Toute fraude peut entraîner l&rsquo;exclusion.</P>,
        },
        {
          id: "comportement",
          title: "Comportement et valeurs",
          body: (
            <>
              <P>Chacune s&rsquo;engage, dans les tribunes, lors des événements, dans les espaces privés en ligne et sur les réseaux sociaux, à :</P>
              <Ul>
                <li>respecter les autres supportrices, les supporters, les joueuses et joueurs, les stadiers et les forces de l&rsquo;ordre ;</li>
                <li>s&rsquo;abstenir de tout propos ou geste discriminatoire, injurieux, haineux, sexiste, homophobe, raciste ou harcelant ;</li>
                <li>ne pas recourir à la violence, physique ou verbale ;</li>
                <li>respecter la loi et le règlement intérieur du stade. L&rsquo;introduction et l&rsquo;usage d&rsquo;engins pyrotechniques dans une enceinte sportive sont interdits et pénalement sanctionnés ; l&rsquo;association ne les cautionne pas ;</li>
                <li>ne pas utiliser le nom ou le logo du groupe à des fins commerciales ou politiques sans accord écrit du bureau.</li>
              </Ul>
            </>
          ),
        },
        {
          id: "evenements",
          title: "Événements",
          body: (
            <Ul>
              <li>L&rsquo;inscription aux événements se fait en ligne depuis son espace membre, dans la limite des places disponibles ; une liste d&rsquo;attente peut être ouverte.</li>
              <li>Lorsqu&rsquo;un événement est payant, l&rsquo;inscription est confirmée à réception du paiement (ou selon les modalités indiquées sur la page de l&rsquo;événement). Les conditions d&rsquo;annulation et de remboursement figurent dans les <A href="/conditions-generales-de-vente">conditions générales de vente</A>.</li>
              <li>Les mineures sont sous la responsabilité de leur représentant légal, sauf mention contraire de l&rsquo;événement.</li>
              <li>Les consignes de sécurité données par l&rsquo;équipe organisatrice doivent être suivies. Chacune reste responsable de ses affaires personnelles.</li>
            </Ul>
          ),
        },
        {
          id: "image",
          title: "Droit à l'image",
          body: <P>Des photographies et vidéos peuvent être réalisées lors des événements pour la communication du groupe (site, réseaux sociaux). Lors de l&rsquo;adhésion, chacune indique si elle accepte la diffusion de son image. Ce choix est libre et peut être retiré à tout moment en écrivant à l&rsquo;association ou depuis la page <A href="/mes-donnees">Mes données</A> : l&rsquo;image concernée est alors retirée des supports contrôlés par l&rsquo;association.</P>,
        },
        {
          id: "espaces-prives",
          title: "Espaces privés et confidentialité",
          body: <P>Les échanges dans les espaces privés du groupe (messageries, réunions) sont confidentiels. Il est interdit de diffuser les coordonnées, photographies ou propos d&rsquo;une autre membre sans son accord.</P>,
        },
        {
          id: "sanctions",
          title: "Manquements et sanctions",
          body: (
            <>
              <P>En cas de manquement au règlement, le bureau peut décider, selon la gravité, d&rsquo;un rappel à l&rsquo;ordre, d&rsquo;un avertissement, d&rsquo;une suspension temporaire ou d&rsquo;une exclusion.</P>
              <P>Avant toute sanction, la personne concernée est informée des faits reprochés et invitée à présenter ses explications. La décision lui est notifiée par écrit. L&rsquo;exclusion ne donne pas lieu à remboursement de la cotisation.</P>
            </>
          ),
        },
        {
          id: "fin",
          title: "Démission et radiation",
          body: <P>Chaque adhérente peut quitter le groupe à tout moment, par simple demande. Elle peut aussi demander l&rsquo;effacement de ses données personnelles (voir <A href="/mes-donnees">Mes données</A>). L&rsquo;adhésion prend fin de plein droit à l&rsquo;expiration de la saison si elle n&rsquo;est pas renouvelée.</P>,
        },
        {
          id: "donnees",
          title: "Données personnelles",
          body: <P>Les données des adhérentes sont traitées conformément à la <A href="/politique-de-confidentialite">politique de confidentialité</A>. Chaque adhérente peut exercer ses droits à tout moment.</P>,
        },
        {
          id: "modifications",
          title: "Modification du règlement",
          body: <P>Le bureau peut modifier ce règlement. La version en vigueur est celle publiée sur cette page, avec sa date de mise à jour. Les adhérentes sont informées des changements importants.</P>,
        },
      ]}
    />
  );
}
