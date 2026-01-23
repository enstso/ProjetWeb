/**
 * Liste de messages “motivants” affichés à l’utilisateur après certaines actions
 * (ex: cocher une étape, valider une habitude, etc.).
 *
 * - Chaque message contient un emoji pour rendre le feedback plus chaleureux.
 * - On garde un tableau simple pour pouvoir facilement ajouter/retirer des phrases.
 */
const messages = [
    "Bien joué ! Continue comme ça 💪",
    "Top ! Chaque petit pas compte ✨",
    "Bravo ! Tu construis une routine solide 🔥",
    "Excellent ! Tu te rapproches de ton objectif 🎯",
    "Nice ! Régularité = progrès 🚀",
];

/**
 * Retourne un message aléatoire dans `messages`.
 *
 * Fonctionnement :
 * - Math.random() produit un nombre entre 0 (inclus) et 1 (exclu)
 * - On le multiplie par la taille du tableau pour obtenir une plage [0..length[
 * - Math.floor() tronque à l'entier inférieur => index valide du tableau
 *
 * Exemple :
 * - si messages.length = 5, l'index sera entre 0 et 4.
 */
export function pickMotivation() {
    return messages[Math.floor(Math.random() * messages.length)];
}
