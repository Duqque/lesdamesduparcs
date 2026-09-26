/**
 * Calendrier des prochains matchs du PSG, saison 2026-2027 (programmation connue au 26 septembre 2026).
 * Jeu de départ inséré une seule fois dans la base ; ensuite le calendrier se met à jour depuis l'administration
 * (Événements > Matchs du PSG : import d'un fichier ICS ou d'un tableau, ou synchronisation automatique d'une adresse ICS).
 * Colonnes : date (AAAA-MM-JJ), heure de Paris, équipe à domicile, équipe à l'extérieur, compétition.
 */
export const PSG_CALENDAR_SEED: ReadonlyArray<readonly [string, string, string, string, string]> = [
  ["2026-10-10", "20:45", "Paris Saint-Germain", "Le Mans", "Ligue 1"],
  ["2026-10-14", "21:00", "Manchester City", "Paris Saint-Germain", "Ligue des champions"],
  ["2026-10-17", "17:15", "Strasbourg", "Paris Saint-Germain", "Ligue 1"],
  ["2026-10-20", "21:00", "Paris Saint-Germain", "FC Barcelone", "Ligue des champions"],
  ["2026-10-25", "21:45", "Paris Saint-Germain", "Lyon", "Ligue 1"],
  ["2026-10-30", "20:00", "Le Havre", "Paris Saint-Germain", "Ligue 1"],
  ["2026-11-03", "21:00", "Villarreal", "Paris Saint-Germain", "Ligue des champions"],
  ["2026-11-07", "20:45", "Paris Saint-Germain", "Troyes", "Ligue 1"],
  ["2026-11-21", "18:15", "Nice", "Paris Saint-Germain", "Ligue 1"],
  ["2026-11-25", "21:00", "Paris Saint-Germain", "AS Roma", "Ligue des champions"],
  ["2026-11-28", "20:45", "Paris Saint-Germain", "Lorient", "Ligue 1"],
  ["2026-12-05", "21:00", "Toulouse", "Paris Saint-Germain", "Ligue 1"],
  ["2026-12-08", "21:00", "Aston Villa", "Paris Saint-Germain", "Ligue des champions"],
  ["2026-12-12", "21:00", "Paris Saint-Germain", "Paris FC", "Ligue 1"],
  ["2027-01-03", "20:45", "Lens", "Paris Saint-Germain", "Ligue 1"],
  ["2027-01-16", "21:00", "Angers", "Paris Saint-Germain", "Ligue 1"],
  ["2027-01-20", "21:00", "Como", "Paris Saint-Germain", "Ligue des champions"],
  ["2027-01-23", "21:00", "Paris Saint-Germain", "Auxerre", "Ligue 1"],
  ["2027-01-27", "21:00", "Paris Saint-Germain", "Galatasaray", "Ligue des champions"],
  ["2027-01-30", "21:00", "Monaco", "Paris Saint-Germain", "Ligue 1"],
  ["2027-02-07", "20:45", "Paris Saint-Germain", "Olympique de Marseille", "Ligue 1"],
  ["2027-02-13", "21:00", "Le Mans", "Paris Saint-Germain", "Ligue 1"],
  ["2027-02-20", "21:00", "Paris Saint-Germain", "Brest", "Ligue 1"],
  ["2027-02-28", "20:45", "Paris Saint-Germain", "Lens", "Ligue 1"],
  ["2027-03-06", "21:00", "Paris Saint-Germain", "Rennes", "Ligue 1"],
  ["2027-03-13", "21:00", "Auxerre", "Paris Saint-Germain", "Ligue 1"],
  ["2027-03-20", "21:00", "Paris Saint-Germain", "Strasbourg", "Ligue 1"],
  ["2027-04-03", "22:00", "Paris FC", "Paris Saint-Germain", "Ligue 1"],
  ["2027-04-10", "22:00", "Paris Saint-Germain", "Le Havre", "Ligue 1"],
  ["2027-04-17", "22:00", "Paris Saint-Germain", "Lille", "Ligue 1"],
  ["2027-04-24", "22:00", "Lorient", "Paris Saint-Germain", "Ligue 1"],
  ["2027-05-01", "22:00", "Paris Saint-Germain", "Angers", "Ligue 1"],
  ["2027-05-09", "20:45", "Lyon", "Paris Saint-Germain", "Ligue 1"],
  ["2027-05-16", "22:00", "Paris Saint-Germain", "Nice", "Ligue 1"],
  ["2027-05-22", "22:00", "Troyes", "Paris Saint-Germain", "Ligue 1"],
  ["2027-05-29", "22:00", "Paris Saint-Germain", "Toulouse", "Ligue 1"],
];
