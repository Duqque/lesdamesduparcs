import type { Metadata } from "next";
import { A, LegalPage, P, Ul } from "@/components/legal/LegalPage";
import { getLegalContext } from "@/lib/server/legal";

export const metadata: Metadata = { title: "Politique de cookies", description: "Ce site ne dépose aucun cookie de mesure d'audience ni de publicité : seuls des témoins strictement nécessaires sont utilisés." };

const th = "py-2 pr-4 text-left font-body text-[12px] font-semibold uppercase tracking-[0.14em] text-mist";
const td = "py-3 pr-4 text-white/80 t-small align-top";

export default async function CookiesPage() {
  const { a, v } = await getLegalContext();
  return (
    <LegalPage
      eyebrow="Vos données"
      title="Politique de cookies"
      intro={<P>Un cookie est un petit fichier enregistré sur votre appareil lorsque vous visitez un site. Ce site n&rsquo;utilise que des témoins <strong className="text-white">strictement nécessaires</strong> à son fonctionnement : il ne dépose <strong className="text-white">aucun cookie de mesure d&rsquo;audience ni de publicité</strong> et ne suit pas votre navigation d&rsquo;un site à l&rsquo;autre.</P>}
      sections={[
        {
          id: "necessaires",
          title: "Ce qui est enregistré sur votre appareil",
          body: (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] border-collapse">
                <thead><tr className="border-b border-white/15"><th className={th}>Nom</th><th className={th}>Rôle</th><th className={th}>Durée</th></tr></thead>
                <tbody>
                  <tr className="border-b border-white/10"><td className={td}><code>ddp_session</code> (préfixé <code>__Host-</code> sur le site en ligne)</td><td className={td}>Maintient votre connexion à votre espace membre (identifiant de session aléatoire).</td><td className={td}>7 jours maximum, ou jusqu&rsquo;à la déconnexion</td></tr>
                  <tr className="border-b border-white/10"><td className={td}><code>ddp_admin</code> (préfixé <code>__Host-</code> sur le site en ligne)</td><td className={td}>Connexion à l&rsquo;espace d&rsquo;administration (équipe uniquement).</td><td className={td}>Session (12 h maximum)</td></tr>
                  <tr className="border-b border-white/10"><td className={td}>Stockage local du navigateur (panier)</td><td className={td}>Conserve le contenu de votre panier sur votre appareil.</td><td className={td}>Jusqu&rsquo;à la fin de la commande ou à l&rsquo;effacement par vos soins</td></tr>
                  <tr className="border-b border-white/10"><td className={td}>Stockage local (préférences)</td><td className={td}>Mémorise le choix du son sur ordinateur et la fermeture de l&rsquo;avis d&rsquo;information.</td><td className={td}>Jusqu&rsquo;à l&rsquo;effacement par vos soins</td></tr>
                  <tr className="border-b border-white/10"><td className={td}>Stockage de session (animation d&rsquo;entrée)</td><td className={td}>Évite de rejouer l&rsquo;animation d&rsquo;accueil pendant la visite.</td><td className={td}>Fermeture de l&rsquo;onglet</td></tr>
                </tbody>
              </table>
            </div>
          ),
        },
        {
          id: "consentement",
          title: "Pourquoi aucun bandeau de consentement",
          body: <P>Les témoins strictement nécessaires à la fourniture du service que vous demandez (connexion, panier) sont exemptés de consentement, conformément à la réglementation et aux lignes directrices de la CNIL. Le site vous en informe par un avis discret, que vous pouvez fermer.</P>,
        },
        {
          id: "audience",
          title: "Statistiques de fréquentation",
          body: <P>L&rsquo;association compte les pages consultées avec un outil interne qui n&rsquo;utilise ni cookie, ni adresse IP, ni identifiant : les chiffres ne permettent pas de vous identifier.</P>,
        },
        {
          id: "tiers",
          title: "Services tiers",
          body: (
            <>
              <P>Lorsque vous quittez le site pour un service tiers, celui-ci applique sa propre politique :</P>
              <Ul>
                <li><strong className="text-white">HelloAsso</strong> (paiement en ligne) : la page de paiement est hébergée par HelloAsso, qui peut déposer ses propres cookies ;</li>
                <li>les réseaux sociaux et plateformes musicales vers lesquels des liens renvoient (Instagram, TikTok, Spotify…).</li>
              </Ul>
            </>
          ),
        },
        {
          id: "controle",
          title: "Gérer les cookies",
          body: <P>Vous pouvez supprimer ou bloquer les cookies depuis les réglages de votre navigateur. Bloquer les témoins nécessaires empêchera toutefois de vous connecter à votre espace. Pour toute question : {v(a.email)} ou <A href="/mes-donnees">Mes données</A>.</P>,
        },
      ]}
    />
  );
}
