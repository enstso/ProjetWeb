const messages = [
    "Bien joué ! Continue comme ça 💪",
    "Top ! Chaque petit pas compte ✨",
    "Bravo ! Tu construis une routine solide 🔥",
    "Excellent ! Tu te rapproches de ton objectif 🎯",
    "Nice ! Régularité = progrès 🚀",
];

export function pickMotivation() {
    return messages[Math.floor(Math.random() * messages.length)];
}
