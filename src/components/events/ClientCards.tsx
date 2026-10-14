"use client";

/**
 * Les mêmes cartes, rendues comme composants client sur la page Événements (éco-conception) : le flux React ne transporte
 * alors que leurs quelques données, au lieu d'une seconde copie complète de leur balisage (déjà présent dans le HTML).
 */
export { EventGridCard } from "./EventGridCard";
export { MatchEventCard } from "@/components/matches/MatchEventCard";
