// Sample crossword data using the compact format
// Format: [number, x, y, direction (0=across, 1=down), answer, clue]

// const sampleCrossword = {
//     size: [5, 5],
//     words: [
//         // Across
//         [1, 0, 0, 0, "MACRO", "Large-scale"],
//         [6, 0, 1, 0, "ALOHA", "Hawaiian greeting"],
//         [7, 0, 2, 0, "CIDER", "Apple drink"],
//         [8, 0, 3, 0, "KNEE", "Leg joint"],
//         [9, 1, 4, 0, "EDEN", "Paradise"],

//         // Down
//         [1, 0, 0, 1, "MACK", "Big ___ (McDonald's burger)"],
//         [2, 1, 0, 1, "ALINE", "Adjust evenly"],
//         [3, 2, 0, 1, "CODED", "In secret language"],
//         [4, 3, 0, 1, "RHEE", "Syngman ___ (Korean leader)"],
//         [5, 4, 0, 1, "OARED", "Rowed"]
//     ],
//     black: [[4, 3], [0, 4]]
// };

// Additional sample puzzle
const sampleCrossword = {
    size: [5, 5],
    words: [
        // Across
        [1, 1, 0, 0, "IDOL", "Pop star or false god"],
        [5, 0, 1, 0, "BADGE", "Scout's achievement"],
        [6, 0, 2, 0, "OCEAN", "Pacific or Atlantic"],
        [7, 0, 3, 0, "AGENT", "007, for one"],
        [8, 1, 4, 0, "TENT", "Camping shelter"],

        // Down
        [1, 0, 1, 1, "BOAT", "Marina sight"],
        [2, 1, 0, 1, "IMAGE", "Photo"],
        [3, 2, 0, 1, "DENT", "Car ding"],
        [4, 3, 0, 1, "OGRE", "Fairy tale villain"],
        [5, 4, 0, 1, "LENT", "Spring period before Easter"]
    ],
    black: [[0, 0], [4, 4], [0, 4]]
};