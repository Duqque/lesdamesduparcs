import type { Metadata } from "next";
import { A, LegalPage, P, Ul } from "@/components/legal/LegalPage";
import { HOST } from "@/lib/legal-info";
import { getLegalContext } from "@/lib/server/legal";

export const metadata: Metadata = { title: "Mentions légales", description: "Éditeur, hébergeur, propriété intellectuelle et informations légales du site des Dames du Parc." };

export default async function MentionsLegalesPage() {
  const { a, v, fullAddress } = await getLegalContext();
  return (
    <LegalPage
      eyebrow="Informations légales"
      title="Mentions légales"
      intro={<P>Conformément aux articles 6-III et 19 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l&rsquo;économie numérique (LCEN), voici les informations légales du site.</P>}
      sections={[
        {
          id: "editeur",
          title: "Éditeur du site",
          body: (
            <>
              <Ul>
                <li><strong className="text-white">Dénomination :</strong> {v(a.legalName || a.name)} (« {a.name} »)</li>
                <li><strong className="text-white">Forme juridique :</strong> {v(a.form)}</li>
                <li><strong className="text-white">Siège social :</strong> {fullAddress}</li>
                <li><strong className="text-white">SIRET :</strong> {v(a.siret)}</li>
                <li><strong className="text-white">N° RNA :</strong> {v(a.rna)}</li>
                <li><strong className="text-white">Adresse e-mail :</strong> {v(a.email)}</li>
                <li><strong className="text-white">Téléphone :</strong> {v(a.phone)}</li>
                <li><strong className="text-white">Directrice de la publication :</strong> {v(a.president)}{a.presidentTitle ? `, ${a.presidentTitle}` : ""}</li>
              </Ul>
            </>
          ),
        },
        {
          id: "hebergeur",
          title: "Hébergeur",
          body: (
            <>
              <Ul>
                <li><strong className="text-white">Société :</strong> {HOST.name}</li>
                <li><strong className="text-white">Adresse :</strong> {HOST.address}</li>
                <li><strong className="text-white">Numéro d&rsquo;identification des entreprises (IDE / TVA) :</strong> {HOST.id}</li>
                <li><strong className="text-white">Site :</strong> <A href={HOST.site}>{HOST.site.replace("https://", "")}</A></li>
              </Ul>
              <P>Le site, sa base de données et les fichiers déposés (pièces justificatives, photographies) sont hébergés par cette société, en Suisse. La Suisse bénéficie d&rsquo;une décision d&rsquo;adéquation de la Commission européenne : les données personnelles y bénéficient d&rsquo;un niveau de protection reconnu comme équivalent à celui de l&rsquo;Union européenne.</P>
            </>
          ),
        },
        {
          id: "conception",
          title: "Conception et développement",
          body: <P>Site conçu et développé sur mesure par Quentin Duquenne.</P>,
        },
        {
          id: "propriete",
          title: "Propriété intellectuelle",
          body: (
            <>
              <P>Les textes, le logo, la charte graphique, les illustrations et l&rsquo;ensemble des éléments du site sont la propriété de l&rsquo;association ou de leurs auteurs et sont protégés par le Code de la propriété intellectuelle. Toute reproduction, représentation ou adaptation, totale ou partielle, sans autorisation écrite préalable est interdite.</P>
              <P>{a.name} est un groupe de supportrices. Ce site n&rsquo;est pas le site officiel du Paris Saint-Germain. Les noms, marques, logos et emblèmes du Paris Saint-Germain et des autres clubs cités appartiennent à leurs propriétaires respectifs et sont utilisés à titre d&rsquo;information.</P>
              <P>Les photographies de supporters sont publiées avec l&rsquo;accord des personnes reconnaissables. Toute personne qui souhaite le retrait d&rsquo;une image peut l&rsquo;obtenir sur simple demande à l&rsquo;adresse indiquée ci-dessus ou via la page <A href="/mes-donnees">Mes données</A>.</P>
            </>
          ),
        },
        {
          id: "donnees",
          title: "Données personnelles et cookies",
          body: (
            <P>Le traitement des données personnelles est décrit dans la <A href="/politique-de-confidentialite">politique de confidentialité</A>, l&rsquo;usage des cookies dans la <A href="/politique-de-cookies">politique de cookies</A>. Vous pouvez à tout moment exercer vos droits (accès, rectification, effacement…) depuis la page <A href="/mes-donnees">Mes données</A>.</P>
          ),
        },
        {
          id: "responsabilite",
          title: "Responsabilité et liens externes",
          body: (
            <>
              <P>L&rsquo;association s&rsquo;efforce de fournir des informations exactes et à jour, mais ne peut garantir l&rsquo;absence d&rsquo;erreur ou d&rsquo;interruption du site. Elle ne saurait être tenue responsable des dommages résultant de l&rsquo;accès au site ou de son utilisation.</P>
              <P>Le site peut contenir des liens vers des sites tiers (réseaux sociaux, plateforme de paiement HelloAsso, plateformes musicales). L&rsquo;association n&rsquo;exerce aucun contrôle sur leur contenu et décline toute responsabilité à leur égard.</P>
            </>
          ),
        },
        {
          id: "droit",
          title: "Droit applicable",
          body: <P>Le site et ses mentions légales sont soumis au droit français. En cas de litige, et à défaut de résolution amiable, les tribunaux français sont seuls compétents.</P>,
        },
      ]}
    />
  );
}
