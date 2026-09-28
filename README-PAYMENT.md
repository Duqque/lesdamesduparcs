# Paiement en ligne (HelloAsso) : guide d'exploitation

Le site **Les Dames du Parc reste maître de toute la logique métier** ; HelloAsso n'est que l'infrastructure de paiement et d'encaissement.

```
Utilisatrice → Catalogue / panier du site → calcul serveur (prix, promotions, stock, adhésion) → commande interne « en attente »
   → HelloAsso Checkout API (intention de paiement) → page de paiement HelloAsso
   → notification (webhook) HelloAsso → relecture du paiement par l'API → validation serveur
   → paiement enregistré → commande PAYÉE → stock confirmé → adhésion activée → facture → tâches e-mail → Resend
```

## 1. Ce qui a été construit, et où

| Demande | Réalisation dans le projet |
|---|---|
| Source de vérité : base MariaDB/MySQL du site | Toutes les données sont dans la base du site (`ddp_docs`, `ddp_files`, `ddp_rate`). HelloAsso ne sert qu'à répondre : payé ? quel identifiant ? quel montant ? quel statut ? |
| Prisma | **Non retenu, volontairement.** Le projet repose sur un magasin de documents JSON sur MySQL/MariaDB (`src/lib/server/db.ts`) qui contient déjà tous les membres, commandes, adhésions et paiements du site : passer à Prisma demanderait une migration complète et risquée. Les modèles demandés existent sous forme de collections équivalentes (tableau ci-dessous). Un schéma Prisma pourra être ajouté plus tard sans changer la logique métier. |
| Modules `lib/helloasso/*` | `src/lib/server/helloasso/` : `config.ts`, `auth.ts`, `client.ts`, `checkout.ts`, `orders.ts`, `webhooks.ts`, `types.ts` (le fichier `helloasso.ts` conserve les noms historiques). |
| Panier, commandes, promotions, stock | `src/lib/server/shop.ts` (catalogue, réservation de stock, promotions), `src/lib/orders.ts`, `src/lib/server/store.ts` (commandes). |
| Création du checkout | `POST /api/checkout` (alias de `/api/shop/checkout`). |
| Webhook | `POST /api/webhooks/helloasso` ; logique de validation : `src/lib/server/payments.ts`. |
| Adhésions | `src/lib/server/business.ts` (formules, adhésions, paiements d'adhésion), `POST /api/members/adhesion`. |
| E-mails | `src/lib/server/email-jobs.ts` (file d'e-mails), `src/lib/server/email.ts` (Resend). |
| Pages de paiement | `/paiement/retour`, `/paiement/erreur`, `/paiement/annule`. |
| État d'une commande | `GET /api/orders/{id}?t=<jeton>` ; nouvel essai : `POST /api/orders/{id}/retry`. |
| Administration | Finances > **Paiements HelloAsso** (paiements, notifications, e-mails, réconciliation), Finances > Factures, Boutique > Commandes / Codes de réduction, Analytics, exports CSV. |

### Correspondance avec les modèles demandés

| Modèle demandé | Collection du site | Remarques |
|---|---|---|
| User | `members` | Compte membre (mot de passe haché, jamais en clair). |
| Product / ProductCategory | `products` (champ `category`) | Prix en **centimes** (`priceCents`), stock par taille, `trackStock` = gestion du stock. |
| Cart / CartItem | panier du navigateur (`src/lib/cart.ts`) | Le navigateur n'envoie que `productId`, `size`, `qty` : **le serveur recalcule tout** (prix, remises, total). |
| Promotion | `promo_codes` | Pourcentage ou montant, minimum, plafond, limites, produits/catégories, membres, nouvelles adhérentes. |
| Order / OrderItem | `orders` (lignes copiées avec nom et prix du moment) | Numéro `DDP-2026-00458`. Statuts ci-dessous. |
| Payment | `helloasso_payments` | Unique par identifiant de paiement HelloAsso, état brut conservé (jamais de donnée bancaire). |
| WebhookEvent | `webhook_events` | Corps brut, empreinte SHA-256 (idempotence), état de traitement, erreur, essais. |
| EmailJob | `email_jobs` | Type, destinataire, clé d'unicité, essais, dernière erreur. |
| Membership | `memberships` + `payments` (kind `adhesion`) | Numéro d'adhérente `NOM…-LDDP2026`. `active` seulement après paiement confirmé. |

### Statuts de commande

| Statut demandé | Statut interne | Signification |
|---|---|---|
| PENDING / PAYMENT_PENDING | `awaiting_payment` | Commande créée, paiement non confirmé. |
| PAID | `paid` | Paiement confirmé par le serveur. |
| FAILED | `failed` | Paiement refusé ou en erreur : nouvel essai possible sur la **même** commande. |
| CANCELLED | `cancelled` | Annulée (ou expirée après 72 h sans paiement) : stock et code promo libérés. |
| REFUNDED / PARTIALLY_REFUNDED | `refunded` / `partially_refunded` | Constaté par la notification HelloAsso « Payment / Refunded ». |

## 2. Installation

```bash
npm install
cp .env.example .env.local     # puis renseigner les variables
npm run build && npm run start
```

La base MySQL/MariaDB est celle de l'hébergement (`DATABASE_URL`). Les tables (`ddp_docs`, `ddp_files`, `ddp_rate`) sont créées automatiquement au premier démarrage : **il n'y a pas de migration à lancer** ; une mise à jour du site n'efface jamais les données. Sans `DATABASE_URL`, les données vont dans `.data/` (développement local uniquement).

## 3. Variables d'environnement

| Variable | Rôle |
|---|---|
| `HELLOASSO_ENV` | `sandbox` ou `production`. Par défaut : `production` quand `NODE_ENV=production`, sinon `sandbox`. |
| `HELLOASSO_CLIENT_ID`, `HELLOASSO_CLIENT_SECRET` | Identifiants API de l'environnement choisi. |
| `HELLOASSO_SANDBOX_CLIENT_ID` / `_CLIENT_SECRET` / `_ORGANIZATION_SLUG` | (facultatif) identifiants propres au sandbox : prioritaires quand `HELLOASSO_ENV=sandbox`. |
| `HELLOASSO_PRODUCTION_CLIENT_ID` / `_CLIENT_SECRET` / `_ORGANIZATION_SLUG` | (facultatif) idem pour la production. **Ne jamais mélanger les identifiants des deux environnements.** |
| `HELLOASSO_ORGANIZATION_SLUG` | Identifiant de l'association dans l'adresse HelloAsso (`HELLOASSO_ORG_SLUG` est accepté aussi). |
| `HELLOASSO_API_URL`, `HELLOASSO_AUTH_URL` | (facultatif) adresses de l'API et du jeton. Par défaut, celles de la documentation officielle : `https://api.helloasso.com/v5` et `https://api.helloasso.com/oauth2/token` (sandbox : `api.helloasso-sandbox.com`). |
| `HELLOASSO_WEBHOOK_SECRET` | Jeton secret (16 caractères minimum) placé dans l'adresse de notification. |
| `HELLOASSO_SIGNATURE_KEY` | (facultatif) clé de signature `x-ha-signature` (réservée aux partenaires HelloAsso). |
| `HELLOASSO_WEBHOOK_ENFORCE_IP` | `1` : n'accepte les notifications que depuis les adresses IP de HelloAsso (51.138.206.200 en production, 4.233.135.234 en sandbox). Nécessite `TRUSTED_PROXY_HOPS` correct. |
| `DATABASE_URL` | Connexion MySQL/MariaDB. |
| `RESEND_API_KEY` | Clé Resend. `RESEND_FROM_EMAIL` (expéditeur, sinon celui de l'administration), `RESEND_REPLY_TO` (adresse de réponse). |
| `NEXT_PUBLIC_SITE_URL` | Adresse publique du site (liens des e-mails et retours de paiement). |
| `CRON_SECRET` | Autorise `POST /api/cron/tick` (rattrapages, nouvelles tentatives d'e-mails). |

**Jamais exposées au navigateur** : `HELLOASSO_CLIENT_SECRET`, `HELLOASSO_WEBHOOK_SECRET`, `RESEND_API_KEY`, `DATABASE_URL` n'ont pas de préfixe `NEXT_PUBLIC_` et ne sont lues que côté serveur. Trois environnements : développement (fichiers JSON, sandbox), préproduction (`HELLOASSO_ENV=sandbox` + base de test), production (`HELLOASSO_ENV=production`).

## 4. Compte HelloAsso et clés API

1. Créer (ou utiliser) le compte de l'association sur helloasso.com et terminer la validation de l'association.
2. **Mon compte > Intégrations et API** : récupérer le `clientId` et le `clientSecret`. Le privilège « Checkout » doit être autorisé pour ce client.
3. Noter l'identifiant (« slug ») de l'association dans l'adresse de sa page HelloAsso : c'est `HELLOASSO_ORGANIZATION_SLUG`.
4. **Sandbox (test)** : créer une association fictive sur `http://www.helloasso-sandbox.com` (inscription sur `auth.helloasso-sandbox.com`). Un premier paiement de test exige de valider le compte avec des documents fictifs ; les cartes de test sont celles indiquées par HelloAsso (Stripe ou Worldline). Les identifiants sandbox et production sont **différents**.
5. Noms d'acheteuse : HelloAsso refuse certains prénoms/noms (valeurs comme « test », caractères répétés, chiffres). En sandbox, utiliser de vrais noms plausibles.
6. L'API d'authentification est limitée (10 requêtes / 10 s, 20 / 10 min, 50 / h) : le jeton (valable 30 min) est mis en cache par environnement.

## 5. Configuration du webhook

Dans **Mon compte > Intégrations et API > Notifications**, déclarer (jusqu'à 5 adresses) :

```
https://www.lesdamesduparc.com/api/webhooks/helloasso?k=<HELLOASSO_WEBHOOK_SECRET>
```

types **Order** et **Payment**. HelloAsso rejoue une notification tant qu'il ne reçoit pas HTTP 200 (jusqu'à 48 h) : le site répond 200 dès qu'elle est traitée (ou déjà traitée), 500 en cas d'erreur transitoire.

Sécurité du webhook : jeton secret dans l'adresse ; corps enregistré tel quel ; **le paiement est toujours relu chez HelloAsso** à partir de l'identifiant enregistré par le site (un corps falsifié ne peut rien confirmer) ; montant et référence revérifiés ; traitement idempotent.

## 6. Configuration Resend

Créer le compte, vérifier le domaine (SPF/DKIM), créer une clé d'envoi, renseigner `RESEND_API_KEY` et l'adresse d'expédition (`RESEND_FROM_EMAIL` ou Administration > Configuration > E-mails). Les e-mails de paiement sont **mis en file** puis envoyés : si Resend est en panne, le paiement reste validé et l'e-mail est retenté (jusqu'à 5 fois, délai croissant) par la tâche planifiée.

Tâche planifiée : appeler toutes les 10 à 15 minutes `POST https://www.lesdamesduparc.com/api/cron/tick` avec l'en-tête `Authorization: Bearer <CRON_SECRET>` (rattrapage des paiements non notifiés, expiration des commandes non réglées après 72 h, nouvelles tentatives d'e-mails).

## 7. Sécurité et fiabilité (points vérifiés par les tests)

- Le navigateur ne peut modifier ni prix, ni réduction, ni total, ni statut de paiement, ni stock : il envoie des identifiants et des quantités.
- La validation d'un paiement vient de **HelloAsso** (notification + relecture serveur), jamais de l'adresse de retour. `/paiement/retour` affiche « Votre paiement est en cours de confirmation » et interroge `GET /api/orders/{id}` ; il ne peut pas déclarer « payé ».
- **Stock** : réservé de façon atomique à la création de la commande (pas de stock négatif si deux acheteuses veulent le dernier article), confirmé au paiement, remis en vente si la commande est annulée, expire (72 h) ou est remboursée.
- **Idempotence** : un même paiement ne produit qu'un seul enregistrement, une seule activation d'adhésion, une seule confirmation de stock, un seul e-mail (clés d'unicité + contrôle de la notification déjà traitée).
- Aucune donnée bancaire n'est reçue ni stockée. Les journaux sont structurés (JSON) et masquent secrets, jetons et mots de passe : `checkout_created`, `checkout_failed`, `webhook_received`, `webhook_processed`, `webhook_duplicate`, `payment_created`, `order_paid`, `membership_activated`, `stock_confirmed`, `email_queued`, `email_sent`, `email_failed`…
- Ordre d'une validation : paiement enregistré > commande payée > stock > adhésion > facture > e-mails en file. **Les e-mails ne conditionnent jamais la validation.**

## 8. Fonctions couvertes

Adhésion seule, produits seuls, commande mixte (adhésion + produits en un seul paiement, pour une membre connectée), quantités, stocks, codes promotionnels (pourcentage, montant fixe, minimum, plafond, limites totale et par compte, produits ou catégories éligibles, réservé aux adhérentes, réservé aux nouvelles adhérentes), événements payants (inscription puis paiement HelloAsso), nouvel essai après échec, factures PDF automatiques, statistiques (Analytics) et exports (Commandes, Paiements HelloAsso, Adhérentes, Produits, Inscriptions, Transactions).

### Limites de l'API HelloAsso (à connaître)

- **Remboursement par l'API** : le point d'accès `POST /payments/{id}/refund` existe mais est protégé par une **authentification forte (MFA)** ; il exige aussi le privilège « RefundManagement ». Le site tente le remboursement et, si HelloAsso le refuse, indique de le faire depuis l'espace HelloAsso ; la notification « Payment / Refunded » met ensuite le site à jour (commande remboursée, stock remis en vente). Un remboursement partiel est possible côté HelloAsso (paramètre `amount`) et repéré par le site à partir des opérations de remboursement.
- **Signature des notifications** : réservée aux partenaires HelloAsso ; une association s'appuie sur l'adresse secrète, la relecture du paiement et, en option, la liste des adresses IP.
- **Intention de paiement** : l'adresse de paiement est valable **15 minutes** et l'encaissement est abandonné après **45 minutes** sans paiement : un « nouvel essai » crée donc une nouvelle intention pour la même commande (la précédente est relue avant, pour ne jamais faire payer deux fois).
- Les inscriptions aux événements et les adhésions **seules** gardent leur propre parcours de paiement ; seule l'adhésion **ajoutée à une commande de la boutique** est un paiement unique.

## 9. Tests

```bash
npm run test:payments
```

Compile une copie du projet, lance de faux serveurs HelloAsso et Resend (`scripts/payments/mock-services.mjs`) puis 77 vérifications (`scripts/payments/run-tests.mjs`) : panier et calcul serveur, promotions (10 %, 15 %, fixe, expiré, inexistant, limité, par compte, réservé membres, plafond, produits éligibles, minimum), stock du dernier article, scénarios A à F (adhésion, produit, adhésion + produit, produits + code, utilisatrice qui ferme son navigateur, même notification deux fois), webhook invalide / dupliqué / commande inexistante / montant incorrect, paiement refusé puis nouvel essai, remboursement, panne de Resend puis nouvelle tentative.

## 10. Mise en production

1. Base de production configurée (`DATABASE_URL`) ; site compilé (`npm run build`).
2. `HELLOASSO_ENV=production` et identifiants **de production** (jamais ceux du sandbox).
3. Webhook déclaré (section 5) ; envoi d'un paiement réel de faible montant pour vérifier la chaîne complète ; vérification dans Finances > Paiements HelloAsso (paiement, notification traitée, e-mail envoyé).
4. Resend : domaine vérifié, clé de production ; tâche planifiée en place.
5. Renseigner les données légales réelles de l'association et le modèle de facture (Configuration).

## 11. Diagnostics

**Un paiement n'apparaît pas.** Finances > Paiements HelloAsso :
1. « Notifications reçues » : la notification est-elle arrivée ? Sinon, vérifier l'adresse et le jeton dans l'espace HelloAsso (l'historique des envois y est visible).
2. Si elle est arrivée avec une erreur : « Rejouer ».
3. Dans tous les cas, saisir le numéro de commande dans **Réconcilier une commande** : le site relit le paiement chez HelloAsso et met la commande à jour (idempotent).
4. Résultat `mismatch` : le montant payé diffère du montant attendu, à vérifier chez HelloAsso.

**Renvoyer un e-mail.** Finances > Paiements HelloAsso > « E-mails de paiement » > **Renvoyer** (l'e-mail est remis en file et l'envoi est tenté). Les factures se retrouvent aussi dans Finances > Factures et sur la fiche de la personne.

**Réconcilier une commande.** Voir ci-dessus, ou attendre la tâche planifiée qui relit toute commande, inscription ou adhésion en attente avec un identifiant de paiement.

**Journaux.** Sortie standard du serveur : une ligne JSON par événement (`event`, `orderNumber`, `orderId`…), sans donnée sensible.
