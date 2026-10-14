/**
 * Découpe un texte saisi dans un <textarea> en paragraphes (séparés par une ligne vide). Un formulaire HTML envoie
 * toujours les retours à la ligne sous la forme \r\n : on les normalise d'abord, sinon une ligne vide (\r\n\r\n)
 * n'est jamais reconnue et tout le texte devient un seul paragraphe. Les retours simples restent dans le paragraphe
 * (à afficher avec `whitespace-pre-line`).
 */
export const toParagraphs = (text: string) =>
  text
    .replace(/\r\n?/g, "\n")
    .split(/\n[ \t]*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
