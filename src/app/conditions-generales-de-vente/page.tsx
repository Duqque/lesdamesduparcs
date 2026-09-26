import type { Metadata } from "next";
import { A, LegalPage, P, Ul } from "@/components/legal/LegalPage";
import { getLegalContext } from "@/lib/server/legal";

export const metadata: Metadata = { title: "Conditions générales de vente", description: "Conditions générales de vente : boutique, adhésion et événements payants des Dames du Parc." };

export default async function CgvPage() {
  const { a, v, fullAddress, refundPolicy } = await getLegalContext();
  return (
    <LegalPage
      eyebrow="Boutique, adhésion et événements"
      title="Conditions générales de vente"
      intro={<P>Ces conditions s&rsquo;appliquent à tout achat réalisé sur ce site : produits de la boutique, cotisations d&rsquo;adhésion et inscriptions aux événements payants. Passer commande vaut acceptation sans réserve de ces conditions.</P>}
      sections={[
        {
          id: "vendeur",
          title: "Vendeur",
          body: (
            <Ul>
              <li><strong className="text-white">{v(a.legalName || a.name)}</strong> ({v(a.form)}), siège : {fullAddress}</li>
              <li>SIRET : {v(a.siret)} · RNA : {v(a.rna)}</li>
              <li>Contact : {v(a.email)}{a.phone ? ` · ${a.phone}` : ""}</li>
            </Ul>
          ),
        },
        {
          id: "produits",
          title: "Produits, adhésions et événements",
          body: <P>Les caractéristiques essentielles de chaque produit, de chaque formule d&rsquo;adhésion et de chaque événement sont présentées sur leur page. Les photographies sont indicatives. Les offres sont valables dans la limite des stocks et des places disponibles.</P>,
        },
        {
          id: "prix",
          title: "Prix",
          body: <P>Les prix sont indiqués en euros, toutes taxes comprises le cas échéant, hors frais de livraison qui sont précisés avant la validation de la commande. Le prix applicable est celui affiché au moment de la commande ; il est recalculé par le site à chaque étape.</P>,
        },
        {
          id: "commande",
          title: "Commande",
          body: (
            <Ul>
              <li>La commande est validée après vérification du panier, saisie des informations demandées et acceptation des présentes conditions, puis paiement.</li>
              <li>Un e-mail de confirmation est envoyé à l&rsquo;adresse indiquée.</li>
              <li>Les articles sont réservés pendant le paiement. Une commande non réglée dans un délai de 72 heures est annulée et les articles sont remis en vente.</li>
              <li>L&rsquo;association peut refuser ou annuler une commande en cas de litige avec l&rsquo;acheteuse, de stock indisponible ou de suspicion de fraude ; le paiement éventuel est alors remboursé.</li>
            </Ul>
          ),
        },
        {
          id: "paiement",
          title: "Paiement",
          body: (
            <>
              <P>Le paiement en ligne s&rsquo;effectue par l&rsquo;intermédiaire de la plateforme <strong className="text-white">HelloAsso</strong>, sur une page de paiement hébergée par HelloAsso. Aucun numéro de carte bancaire n&rsquo;est saisi sur ce site ni conservé par l&rsquo;association. HelloAsso peut proposer une contribution volontaire au fonctionnement de la plateforme : elle est facultative et distincte du prix de la commande.</P>
              <P>Certaines inscriptions peuvent se régler sur place ou selon d&rsquo;autres modalités précisées sur la page de l&rsquo;événement. Le paiement est exigible à la commande.</P>
            </>
          ),
        },
        {
          id: "reductions",
          title: "Codes de réduction",
          body: <P>Un code de réduction est valable pour la période, le montant minimum de commande et le nombre d&rsquo;utilisations indiqués lors de sa diffusion. Il n&rsquo;est ni échangeable contre de l&rsquo;argent, ni remboursable, ni rétroactif. Un seul code peut être utilisé par commande.</P>,
        },
        {
          id: "livraison",
          title: "Livraison et retrait",
          body: (
            <Ul>
              <li><strong className="text-white">Livraison à domicile :</strong> à l&rsquo;adresse indiquée lors de la commande ; les frais éventuels et le seuil de livraison offerte sont affichés dans le panier.</li>
              <li><strong className="text-white">Retrait lors d&rsquo;un événement :</strong> gratuit, à la date et au lieu de l&rsquo;événement choisi.</li>
              <li>Les délais sont indicatifs. En cas de retard de plus de 30 jours, l&rsquo;acheteuse peut annuler la commande dans les conditions prévues par le Code de la consommation.</li>
              <li>Il appartient à l&rsquo;acheteuse de vérifier l&rsquo;état du colis à la réception et de signaler toute anomalie dans les meilleurs délais.</li>
            </Ul>
          ),
        },
        {
          id: "retractation",
          title: "Droit de rétractation",
          body: (
            <>
              <P>Pour les achats de produits à distance, l&rsquo;acheteuse consommatrice dispose de <strong className="text-white">14 jours</strong> à compter de la réception pour se rétracter, sans avoir à justifier de motif (articles L221-18 et suivants du Code de la consommation). Il suffit d&rsquo;écrire à {v(a.email)} en indiquant clairement sa décision et les références de la commande.</P>
              <P>Les produits doivent être retournés sous 14 jours après la communication de la décision, en bon état, dans leur emballage d&rsquo;origine ; les frais de retour sont à la charge de l&rsquo;acheteuse. Le remboursement intervient au plus tard 14 jours après réception du retour, par le même moyen de paiement.</P>
              <P>Le droit de rétractation ne s&rsquo;applique pas aux produits personnalisés, ni aux prestations de loisirs à date déterminée (inscription à un événement daté), conformément à l&rsquo;article L221-28 du Code de la consommation.</P>
            </>
          ),
        },
        {
          id: "adhesion-evenements",
          title: "Adhésions et événements payants",
          body: (
            <>
              <P>La cotisation d&rsquo;adhésion est due pour la saison en cours et n&rsquo;est pas remboursable, sauf décision exceptionnelle du bureau. L&rsquo;inscription à un événement payant est confirmée à réception du paiement.</P>
              <P><strong className="text-white">Annulation et remboursement d&rsquo;un événement :</strong> {refundPolicy ? refundPolicy : "en cas d'annulation de l'événement par l'association, l'inscription est intégralement remboursée. En cas d'annulation par la participante, le remboursement est examiné selon le délai de prévenance et les frais déjà engagés."}</P>
            </>
          ),
        },
        {
          id: "garanties",
          title: "Garanties légales",
          body: <P>Les produits bénéficient de la garantie légale de conformité (articles L217-3 et suivants du Code de la consommation) et de la garantie contre les vices cachés (articles 1641 et suivants du Code civil). En cas de défaut, contactez l&rsquo;association à {v(a.email)} : le produit sera réparé, remplacé ou remboursé selon les dispositions légales.</P>,
        },
        {
          id: "mediation",
          title: "Réclamation et médiation",
          body: <P>Toute réclamation peut être adressée à {v(a.email)}. À défaut de solution amiable, la consommatrice peut recourir gratuitement à un médiateur de la consommation : [{"médiateur à renseigner par l'association"}]. Le recours au médiateur ne prive pas de la saisine des tribunaux.</P>,
        },
        {
          id: "donnees",
          title: "Données personnelles",
          body: <P>Les données nécessaires au traitement de la commande sont utilisées conformément à la <A href="/politique-de-confidentialite">politique de confidentialité</A>.</P>,
        },
        {
          id: "droit",
          title: "Droit applicable",
          body: <P>Les présentes conditions sont soumises au droit français. Tout litige relève des tribunaux compétents, sans préjudice des droits de la consommatrice de saisir la juridiction de son domicile.</P>,
        },
      ]}
    />
  );
}
