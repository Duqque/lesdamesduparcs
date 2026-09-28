"use client";

/** Dernier filet : erreur dans la structure même du site (remplace toute la page, styles intégrés). */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, background: "#030919", color: "#f4f6fa", fontFamily: "system-ui, sans-serif" }}>
        <main style={{ minHeight: "100svh", display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}>
          <div>
            <p style={{ fontSize: 96, margin: 0, color: "#f01634", fontWeight: 700 }}>500</p>
            <h1 style={{ fontSize: 28, margin: "12px 0" }}>Erreur interne du serveur</h1>
            <p style={{ opacity: 0.8, maxWidth: 480, margin: "0 auto 24px" }}>Un problème est survenu de notre côté. Réessayez dans quelques instants.</p>
            {error.digest && <p style={{ opacity: 0.5, fontSize: 12 }}>Référence : {error.digest}</p>}
            <p style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button type="button" onClick={() => window.history.back()} style={{ padding: "14px 24px", borderRadius: 10, border: "1px solid rgba(255,255,255,.3)", background: "transparent", color: "#fff", fontSize: 15 }}>Retour</button>
              <a href="/" style={{ padding: "14px 24px", borderRadius: 10, background: "#d90f2c", color: "#fff", textDecoration: "none", fontSize: 15 }}>Page d’accueil</a>
            </p>
          </div>
        </main>
      </body>
    </html>
  );
}
