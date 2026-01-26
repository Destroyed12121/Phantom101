const API_KEY = '2713804610e1e236b1cf44bfac3a7776';
const IMG_BASE = 'https://image.tmdb.org/t/p/w300';

const FEATURED = [{
    id: 950779,
    title: "Five Nights at Freddy's",
    poster_path: "/A4j8S6moJS2zNtRR8oWF08gRnL5.jpg",
    release_date: "2023-10-25",
    vote_average: 7.6,
    media_type: "movie",
    overview: "Recently fired and desperate for work, a troubled young man named Mike agrees to take a position as a night security guard at an abandoned theme restaurant: Freddy Fazbear's Pizzeria. But he soon discovers that nothing at Freddy's is what it seems."
}, {
    id: 1047585,
    title: "Five Nights at Freddy's 2",
    poster_path: "/x0f24255a019409893902996.jpg",
    release_date: "2025-12-05",
    vote_average: 0,
    media_type: "movie",
    overview: "The sequel to the 2023 film Five Nights at Freddy's. (Coming Soon)"
}, {
    id: 76600,
    title: "Avatar: The Way of Water",
    poster_path: "/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg",
    release_date: "2022-12-14",
    vote_average: 7.7,
    media_type: "movie",
    overview: "Set more than a decade after the events of the first film, learn the story of the Sully family (Jake, Neytiri, and their kids), the trouble that follows them, the lengths they go to keep each other safe, the battles they fight to stay alive, and the tragedies they endure."
}, {
    id: 677179,
    title: "Creed III",
    poster_path: "/cvsXj3I9Q2iyyIo95AecSd1tad7.jpg",
    release_date: "2023-03-01",
    vote_average: 7.2,
    media_type: "movie",
    overview: "After dominating the boxing world, Adonis Creed has been thriving in both his career and family life. When a childhood friend and former boxing prodigy, Damian Anderson, resurfaces after serving a long sentence in prison, he is eager to prove that he deserves his shot in the ring."
}, {
    id: 361743,
    title: "Top Gun: Maverick",
    poster_path: "/62HCnUTziyWcpDaBO2i1DX17ljH.jpg",
    release_date: "2022-05-24",
    vote_average: 8.3,
    media_type: "movie",
    overview: "After more than thirty years of service as one of the Navy’s top aviators, and dodging the advancement in rank that would ground him, Pete “Maverick” Mitchell finds himself training a detachment of TOP GUN graduates for a specialized mission the likes of which no living pilot has ever seen."
}, {
    id: 502356,
    title: "The Super Mario Bros. Movie",
    poster_path: "/qNBAXBIQlnOThrVvA6mA2K5ggV6.jpg",
    release_date: "2023-04-05",
    vote_average: 7.8,
    media_type: "movie",
    overview: "While working underground to fix a water main, Brooklyn plumbers—and brothers—Mario and Luigi are transported down a mysterious pipe and wander into a magical new world. But when the brothers are separated, Mario embarks on an epic quest to find Luigi."
}, {
    id: 693134,
    title: "Dune: Part Two",
    poster_path: "/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
    release_date: "2024-02-27",
    vote_average: 8.3,
    media_type: "movie",
    overview: "Follow the mythic journey of Paul Atreides as he unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family."
}, {
    id: 872585,
    title: "Oppenheimer",
    poster_path: "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
    release_date: "2023-07-19",
    vote_average: 8.1,
    media_type: "movie",
    overview: "The story of J. Robert Oppenheimer's role in the development of the atomic bomb during World War II."
}, {
    id: 569094,
    title: "Spider-Man: Across the Spider-Verse",
    poster_path: "/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg",
    release_date: "2023-05-31",
    vote_average: 8.4,
    media_type: "movie",
    overview: "After reuniting with Gwen Stacy, Brooklyn’s full-time, friendly neighborhood Spider-Man is catapulted across the Multiverse, where he encounters the Spider Society, a team of Spider-People charged with protecting the Multiverse’s very existence."
}, {
    id: 157336,
    title: "Interstellar",
    poster_path: "/gEU2QniL6C971PN62uvp2GMz5iH.jpg",
    release_date: "2014-11-05",
    vote_average: 8.4,
    media_type: "movie",
    overview: "The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances involved in an interstellar voyage."
}, {
    id: 299534,
    title: "Avengers: Endgame",
    poster_path: "/or06FN3Dka5tukK1e9sl16pB3iy.jpg",
    release_date: "2019-04-24",
    vote_average: 8.3,
    media_type: "movie",
    overview: "After the devastating events of Infinity War, the universe is in ruins. With the help of remaining allies, the Avengers assemble once more in order to reverse Thanos' actions and restore balance to the universe."
}, {
    id: 496243,
    title: "Parasite",
    poster_path: "/7IiTTgloJzvGI1TAYymC8urRhuB.jpg",
    release_date: "2019-05-30",
    vote_average: 8.5,
    media_type: "movie",
    overview: "All-unemployed Ki-taek's family takes peculiar interest in the wealthy and glamorous Parks for their livelihood until they get entangled in an unexpected incident."
}, {
    id: 27205,
    title: "Inception",
    poster_path: "/oYuLEt3zVCKqJCZVPr6QqXV6An5.jpg",
    release_date: "2010-07-15",
    vote_average: 8.4,
    media_type: "movie",
    overview: "Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets is offered a chance to regain his old life as payment for a task considered to be impossible: \"inception\", the implantation of another person's idea into a target's subconscious."
}, {
    id: 155,
    title: "The Dark Knight",
    poster_path: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    release_date: "2008-07-14",
    vote_average: 8.5,
    media_type: "movie",
    overview: "Batman raises the stakes in his war on crime. With the help of Lt. Jim Gordon and District Attorney Harvey Dent, Batman sets out to dismantle the remaining criminal organizations that plague the streets. The partnership proves to be effective, but they soon find themselves prey to a reign of chaos unleashed by a rising criminal mastermind known to the terrified citizens of Gotham as the Joker."
}, {
    id: 634649,
    title: "Spider-Man: No Way Home",
    poster_path: "/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg",
    release_date: "2021-12-15",
    vote_average: 8.0,
    media_type: "movie",
    overview: "Peter Parker is unmasked and no longer able to separate his normal life from the high-stakes of being a super-hero. When he asks for help from Doctor Strange the stakes become even more dangerous, forcing him to discover what it truly means to be Spider-Man."
}, {
    id: 763215,
    title: "Damsel",
    poster_path: "/sMp34cNKjIb18JkPriu42ShF7qO.jpg",
    release_date: "2024-03-08",
    vote_average: 7.2,
    media_type: "movie",
    overview: "A young woman's marriage to a charming prince turns into a fierce fight for survival when she is offered up as a sacrifice to a fire-breathing dragon."
}, {
    id: 603,
    title: "The Matrix",
    poster_path: "/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
    release_date: "1999-03-30",
    vote_average: 8.2,
    media_type: "movie",
    overview: "Set in the 22nd century, The Matrix tells the story of a computer hacker who joins a group of underground insurgents fighting the vast and powerful computers who now rule the earth."
}, {
    id: 671,
    title: "Harry Potter and the Sorcerer's Stone",
    poster_path: "/wuMc08IPKEatf9rnMNXvIDxqP4W.jpg",
    release_date: "2001-11-16",
    vote_average: 7.9,
    media_type: "movie",
    overview: "Harry Potter has lived under the stairs at his aunt and uncle's house his whole life. But on his 11th birthday, he learns he's a powerful wizard -- with a place waiting for him at the Hogwarts School of Witchcraft and Wizardry. As he learns to harness his newfound powers with the help of the school's kindly headmaster, Harry uncovers the truth about his parents' deaths -- and about the villain who's to blame."
}, {
    id: 954,
    title: "Mission: Impossible - Dead Reckoning Part One",
    poster_path: "/NNxYkU70HPurnNCSiCjYAmacwm.jpg",
    release_date: "2023-07-08",
    vote_average: 7.6,
    media_type: "movie",
    overview: "Ethan Hunt and his IMF team embark on their most dangerous mission yet: To track down a terrifying new weapon that threatens all of humanity before it falls into the wrong hands."
}, {
    id: 385687,
    title: "Fast X",
    poster_path: "/fiVW06jE7z9YnO4trhaMEdclSiC.jpg",
    release_date: "2023-05-17",
    vote_average: 7.2,
    media_type: "movie",
    overview: "Over many missions and against impossible odds, Dom Toretto and his family have outsmarted, out-nerved and outdriven every foe in their path. Now, they confront the most lethal opponent they've ever faced: A terrifying threat emerging from the shadows of the past who's fueled by blood revenge, and who is determined to shatter this family and destroy everything—and everyone—that Dom loves, forever."
}, {
    id: 453395,
    title: "Doctor Strange in the Multiverse of Madness",
    poster_path: "/9Gtg2DzBhmYamXBS1hKAhiwbBKS.jpg",
    release_date: "2022-05-04",
    vote_average: 7.4,
    media_type: "movie",
    overview: "Doctor Strange, with the help of mystical allies both old and new, traverses the mind-bending and dangerous alternate realities of the Multiverse to confront a mysterious new adversary."
}, {
    id: 414906,
    title: "The Batman",
    poster_path: "/74xTEgt7R36Fpooo50x9TfdLn74.jpg",
    release_date: "2022-03-01",
    vote_average: 7.7,
    media_type: "movie",
    overview: "In his second year of fighting crime, Batman uncovers corruption in Gotham City that connects to his own family while facing a serial killer known as the Riddler."
}, {
    id: 505642,
    title: "Black Panther: Wakanda Forever",
    poster_path: "/sv1xJUazXeYqALzczSZ3O6nkH75.jpg",
    release_date: "2022-11-09",
    vote_average: 7.2,
    media_type: "movie",
    overview: "Queen Ramonda, Shuri, M’Baku, Okoye and the Dora Milaje fight to protect their nation from intervening world powers in the wake of King T’Challa’s death."
}, {
    id: 436270,
    title: "Black Adam",
    poster_path: "/pFlaoHTZeyNkG83vxsAJiGzfSsa.jpg",
    release_date: "2022-10-19",
    vote_average: 7.1,
    media_type: "movie",
    overview: "Nearly 5,000 years after he was bested on himself the almighty powers of the Egyptian gods—and imprisoned just as quickly—Black Adam is freed from his earthly tomb, ready to unleash his unique form of justice on the modern world."
}, {
    id: 335787,
    title: "Uncharted",
    poster_path: "/rJHC1RUORuUhtf06xptQlhaUDh6.jpg",
    release_date: "2022-02-10",
    vote_average: 7.0,
    media_type: "movie",
    overview: "A young street-smart, Nathan Drake and his wisecracking partner Victor “Sully” Sullivan embark on a dangerous pursuit of “the greatest treasure never found” while also tracking clues that may lead to Nathan’s long-lost brother."
}, {
    id: 1011985,
    title: "Kung Fu Panda 4",
    poster_path: "/kDp1vUBnMpe8ak4rjgl3cLELqjU.jpg",
    release_date: "2024-03-02",
    vote_average: 7.6,
    media_type: "movie",
    overview: "Po is gearing up to become the spiritual leader of his Valley of Peace, but also needs someone to take his place as Dragon Warrior. As such, he will train a new kung fu practitioner for the spot and will encounter a villain called the Chameleon who conjures villains from the past."
}, {
    id: 934632,
    title: "Rebel Moon - Part Two: The Scargiver",
    poster_path: "/cxevDYdeFkiixRShbObdwAHBZry.jpg",
    release_date: "2024-04-19",
    vote_average: 6.8,
    media_type: "movie",
    overview: "The rebels gear up for battle against the ruthless forces of the Motherworld as unbreakable bonds are forged, heroes emerge — and legends are made."
}, {
    id: 823464,
    title: "Godzilla x Kong: The New Empire",
    poster_path: "/tMefBSflv6PGmWv7PVOed9AQhtd.jpg",
    release_date: "2024-03-27",
    vote_average: 7.2,
    media_type: "movie",
    overview: "Following their explosive showdown, Godzilla and Kong must reunite against a colossal undiscovered threat hidden within our world, challenging their very existence – and our own."
}, {
    id: 609681,
    title: "The Marvels",
    poster_path: "/9GBhzXMFjgcZ3FdR9w3bUMMTx5d.jpg",
    release_date: "2023-11-08",
    vote_average: 6.3,
    media_type: "movie",
    overview: "Carol Danvers, aka Captain Marvel, has reclaimed her identity from the tyrannical Kree and taken revenge on the Supreme Intelligence. But unintended consequences see Carol shouldering the burden of a destabilized universe. When her duties send her to an anomalous wormhole linked to a Kree revolutionary, her powers become entangled with that of Jersey City super-fan Kamala Khan, aka Ms. Marvel, and Carol’s estranged niece, now S.A.B.E.R. astronaut Captain Monica Rambeau. Together, this unlikely trio must team up and learn to work in concert to save the universe."
}, {
    id: 787699,
    title: "Wonka",
    poster_path: "/qhb1qOilapbapxWQn9jtRCMwXJF.jpg",
    release_date: "2023-12-06",
    vote_average: 7.2,
    media_type: "movie",
    overview: "Willy Wonka – chock-full of ideas and determined to change the world one delectable bite at a time – is proof that the best things in life begin with a dream, and if you’re lucky enough to meet Willy Wonka, anything is possible."
}, {
    id: 346698,
    title: "Barbie",
    poster_path: "/iuFNMS8U5cb6xfzi51QaajTrKB.jpg",
    release_date: "2023-07-19",
    vote_average: 7.1,
    media_type: "movie",
    overview: "Barbie and Ken are having the time of their lives in the colorful and seemingly perfect world of Barbie Land. However, when they get a chance to go to the real world, they soon discover the joys and perils of living among humans."
}, {
    id: 447365,
    title: "Guardians of the Galaxy Vol. 3",
    poster_path: "/r2J02Z2OpNTctfOSN1Ydgii51I3.jpg",
    release_date: "2023-05-03",
    vote_average: 8.0,
    media_type: "movie",
    overview: "Peter Quill, still reeling from the loss of Gamora, must rally his team around him to defend the universe along with protecting one of their own. A mission that, if not completed successfully, could quite possibly lead to the end of the Guardians as we know them."
}, {
    id: 603692,
    title: "John Wick: Chapter 4",
    poster_path: "/vZloFAK7NmvMGKE7VkF5UPurDq.jpg",
    release_date: "2023-03-22",
    vote_average: 7.8,
    media_type: "movie",
    overview: "With the price on his head ever increasing, John Wick uncovers a path to defeating The High Table. But before he can earn his freedom, Wick must face off against a new enemy with powerful alliances across the globe and forces that turn old friends into foes."
}, {
    id: 475557,
    title: "Joker",
    poster_path: "/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg",
    release_date: "2019-10-02",
    vote_average: 8.2,
    media_type: "movie",
    overview: "During the 1980s, a failed stand-up comedian is driven insane and turns to a life of crime and chaos in Gotham City while becoming an infamous psychopathic crime figure."
}, {
    id: 1726,
    title: "Iron Man",
    poster_path: "/78lPtwv72eTNqFW9COBYI0dWDJa.jpg",
    release_date: "2008-04-30",
    vote_average: 7.6,
    media_type: "movie",
    overview: "After being held captive in an Afghan cave, billionaire engineer Tony Stark creates a unique weaponized suit of armor to fight evil."
}, {
    id: 299536,
    title: "Avengers: Infinity War",
    poster_path: "/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg",
    release_date: "2018-04-25",
    vote_average: 8.3,
    media_type: "movie",
    overview: "As the Avengers and their allies have continued to protect the world from threats too large for any one hero to handle, a new danger has emerged from the cosmic shadows: Thanos."
}, {
    id: 284054,
    title: "Black Panther",
    poster_path: "/uxzzxijgPIY7slzFvMotPv8wjKA.jpg",
    release_date: "2018-02-13",
    vote_average: 7.4,
    media_type: "movie",
    overview: "King T'Challa returns home to the reclusive, technologically advanced African nation of Wakanda to serve as his country's new leader. However, T'Challa soon finds that he is challenged for the throne from factions within his own country."
}, {
    id: 293660,
    title: "Deadpool",
    poster_path: "/fSRb7vyIP8rQpL0I47P3qUsEKX3.jpg",
    release_date: "2016-02-09",
    vote_average: 7.6,
    media_type: "movie",
    overview: "The origin story of former Special Forces operative turned mercenary Wade Wilson, who, after being subjected to a rogue experiment that leaves him with accelerated healing powers, adopts the alter ego Deadpool."
}, {
    id: 263115,
    title: "Logan",
    poster_path: "/fnbjc3A4U7j9PMdcsf7pixjA4ola.jpg",
    release_date: "2017-02-28",
    vote_average: 7.8,
    media_type: "movie",
    overview: "In the near future, a weary Logan cares for an ailing Professor X in a hideout on the Mexican border. But Logan's attempts to hide from the world and his legacy are upended when a young mutant arrives, pursued by dark forces."
}, {
    id: 118340,
    title: "Guardians of the Galaxy",
    poster_path: "/r7vmZjiyZw9rpJMQJdXpJLS1YEX.jpg",
    release_date: "2014-07-30",
    vote_average: 7.9,
    media_type: "movie",
    overview: "Light years from Earth, 26 years after being abducted, Peter Quill finds himself the prime target of a manhunt after discovering an orb wanted by Ronan the Accuser."
}, {
    id: 284053,
    title: "Thor: Ragnarok",
    poster_path: "/rzRwTcFvttcN1ZpX2xv4j3tSdJu.jpg",
    release_date: "2017-10-25",
    vote_average: 7.6,
    media_type: "movie",
    overview: "Thor is imprisoned on the other side of the universe without his mighty hammer and finds himself in a race against time to get back to Asgard to stop Ragnarok – the destruction of his homeworld and the end of Asgardian civilization."
}, {
    id: 271110,
    title: "Captain America: Civil War",
    poster_path: "/rAGiXaUfPzY7CDEyNKUofk3Kw2e.jpg",
    release_date: "2016-04-27",
    vote_average: 7.4,
    media_type: "movie",
    overview: "Following the events of Age of Ultron, the collective governments of the world pass an act designed to regulate all superhuman activity. This polarizes opinion amongst the Avengers, causing two factions to side with Iron Man or Captain America, which causes an epic battle between former allies."
}, {
    id: 168259,
    title: "Furious 7",
    poster_path: "/kto85hwb85Op8uFz5U4K5f4c4Ie.jpg",
    release_date: "2015-04-01",
    vote_average: 7.2,
    media_type: "movie",
    overview: "Deckard Shaw seeks revenge against Dominic Toretto and his family for his comatose brother."
}, {
    id: 519182,
    title: "Despicable Me 4",
    poster_path: "/wWba3TaojhK7Ndyc1Q959b7mM02.jpg",
    release_date: "2024-07-03",
    vote_average: 7.3,
    media_type: "movie",
    overview: "Gru and Lucy and their girls—Margo, Edith and Agnes—welcome a new member to the Gru family, Gru Jr., who is intent on tormenting his dad. Gru also faces a new nemesis in Maxime Le Mal and his femme fatale girlfriend Valentina, forcing the family to go on the run."
}, {
    id: 1022789,
    title: "Inside Out 2",
    poster_path: "/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg",
    release_date: "2024-06-12",
    vote_average: 7.7,
    media_type: "movie",
    overview: "Teenager Riley's mind headquarters is undergoing a sudden demolition to make room for something entirely unexpected: new Emotions! Joy, Sadness, Anger, Fear and Disgust, who’ve long been running a successful operation by all accounts, aren’t sure how to feel when Anxiety shows up. And it looks like she’s not alone."
}, {
    id: 746036,
    title: "The Fall Guy",
    poster_path: "/tSz1qsmSJon0rqnHBxXZm ROTW2f.jpg",
    release_date: "2024-04-24",
    vote_average: 7.3,
    media_type: "movie",
    overview: "Fresh off an almost career-ending accident, stuntman Colt Seavers has to track down a missing movie star, solve a conspiracy and try to win back the love of his life while still doing his day job."
}, {
    id: 653346,
    title: "Kingdom of the Planet of the Apes",
    poster_path: "/gKkl37BQuKTanygYQG1pyYgLVgf.jpg",
    release_date: "2024-05-08",
    vote_average: 7.1,
    media_type: "movie",
    overview: "Several generations in the future following Caesar's reign, in which apes are the dominant species living harmoniously and humans have been reduced to living in the shadows. As a new tyrannical ape leader builds his empire, one young ape undertakes a harrowing journey that will cause him to question all that he has known about the past and to make choices that will define a future for apes and humans alike."
}, {
    id: 1011985,
    title: "Kung Fu Panda 4",
    poster_path: "/kDp1vUBnMpe8ak4rjgl3cLELqjU.jpg",
    release_date: "2024-03-02",
    vote_average: 7.1,
    media_type: "movie",
    overview: "Po is gearing up to become the spiritual leader of his Valley of Peace, but also needs someone to take his place as Dragon Warrior. As such, he will train a new kung fu practitioner for the spot and will encounter a villain called the Chameleon who conjures villains from the past."
}, {
    id: 969492,
    title: "Land of Bad",
    poster_path: "/h3jYanWMEJq6JJsCopy1h7cT2Hs.jpg",
    release_date: "2024-02-16",
    vote_average: 7.1,
    media_type: "movie",
    overview: "When a Delta Force special ops mission goes terribly wrong, Air Force drone pilot Reaper has 48 hours to remedy what has devolved into a wild rescue operation. With no weapons and no communication other than the drone above, the ground mission becomes a full-scale battle when the team is discovered by the enemy."
}, {
    id: 933131,
    title: "Godzilla Minus One",
    poster_path: "/hkxxMIGaiCTmrEArK7J92JkKN0X.jpg",
    release_date: "2023-11-03",
    vote_average: 7.8,
    media_type: "movie",
    overview: "In postwar Japan, Godzilla brings new devastation to an already scorched landscape. With no military intervention or government help in sight, the survivors must join together to fight back against the nuclear behemoth."
}, {
    id: 35941,
    title: "Terminator 2: Judgment Day",
    poster_path: "/5M0j0B18abtBI5Tf7ACxMnMw52Q.jpg",
    release_date: "1991-07-03",
    vote_average: 8.1,
    media_type: "movie",
    overview: "Nearly 10 years have passed since Sarah Connor was targeted for termination by a cyborg from the future. Now her son, John, the future leader of the resistance, is the target for a newer, more deadly terminator. Once again, the resistance has managed to send a protector back to attempt to save John and his mother Sarah."
}, {
    id: 792307,
    title: "Poor Things",
    poster_path: "/kCGlIMHnOm8JPXq3rXM6c5wMxcT.jpg",
    release_date: "2023-12-07",
    vote_average: 7.8,
    media_type: "movie",
    overview: "Brought back to life by an unorthodox scientist, a young woman runs off with a lawyer on a whirlwind adventure across the continents. Free from the prejudices of her times, she grows steadfast in her purpose to stand for equality and liberation."
}, {
    id: 609681,
    title: "The Marvels",
    poster_path: "/9GBhzXMFjgcZ3FdR9w3bUMMTx5d.jpg",
    release_date: "2023-11-08",
    vote_average: 6.2,
    media_type: "movie",
    overview: "Carol Danvers, aka Captain Marvel, has reclaimed her identity from the tyrannical Kree and taken revenge on the Supreme Intelligence. But unintended consequences see Carol shouldering the burden of a destabilized universe. When her duties send her to an anomalous wormhole linked to a Kree revolutionary, her powers become entangled with that of Jersey City super-fan Kamala Khan, aka Ms. Marvel, and Carol’s estranged niece, now S.A.B.E.R. astronaut Captain Monica Rambeau. Together, this unlikely trio must team up and learn to work in concert to save the universe."
}, {
    id: 572802,
    title: "Aquaman and the Lost Kingdom",
    poster_path: "/7lTnXOy0iNtBAdRP3TZvaKJ77F6.jpg",
    release_date: "2023-12-20",
    vote_average: 6.8,
    media_type: "movie",
    overview: "Black Manta seeks revenge on Aquaman for his father's death. Wielding the Black Trident power, he becomes a formidable foe. To defend Atlantis, Aquaman forges an alliance with his imprisoned brother. They must protect the kingdom."
}, {
    id: 46648,
    title: "True Grit",
    poster_path: "/tF7M5m8303j55Z74L2Y7FfwjAAK.jpg",
    release_date: "2010-12-22",
    vote_average: 7.4,
    media_type: "movie",
    overview: "Following the murder of her father by hired hand Tom Chaney, 14-year-old farm girl Mattie Ross sets out to capture the killer. To aid her, she hires the toughest U.S. marshal she can find, a man with 'true grit,' Reuben J. 'Rooster' Cogburn."
}, {
    id: 24428,
    title: "The Avengers",
    poster_path: "/RYMX2wcKCBAr24UyPD7xwmjaTn.jpg",
    release_date: "2012-04-25",
    vote_average: 7.7,
    media_type: "movie",
    overview: "When an unexpected enemy emerges and threatens global safety and security, Nick Fury, director of the international peacekeeping agency known as S.H.I.E.L.D., finds himself in need of a team to pull the world back from the brink of disaster. Spanning the globe, a daring recruitment effort begins!"
}, {
    id: 1891,
    title: "The Empire Strikes Back",
    poster_path: "/nNAeTmF4CtdSKOQIhfHYSCJOjX.jpg",
    release_date: "1980-05-20",
    vote_average: 8.4,
    media_type: "movie",
    overview: "The epic saga continues as Luke Skywalker, in hopes of defeating the evil Galactic Empire, learns the ways of the Jedi from aging master Yoda. But Darth Vader is more determined than ever to capture Luke. Meanwhile, rebel leader Princess Leia, cocky Han Solo, Chewbacca, and droids C-3PO and R2-D2 are thrown into various stages of capture, betrayal and despair."
}];

let currentTab = 'movies';
let currentCategory = 'featured';
let currentGenreId = '';
let currentPage = 1;
let isLoading = false;
let currentShow = null;

const grid = document.getElementById('media-grid');
const searchInput = document.getElementById('search-input');
const suggestions = document.getElementById('suggestions');

// init
document.addEventListener('DOMContentLoaded', () => {
    if (!grid) return;

    loadGenres();
    loadMedia();

    document.getElementById('movies-tab').onclick = () => switchTab('movies');
    document.getElementById('tv-tab').onclick = () => switchTab('tv');

    document.querySelectorAll('.category-pill').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.category-pill').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.cat;
            currentGenreId = '';
            const genreSelect = document.getElementById('genre-select');
            if (genreSelect) genreSelect.value = '';
            currentPage = 1;
            loadMedia();
        };
    });

    const loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn) loadMoreBtn.onclick = () => {
        currentPage++;
        loadMedia(currentPage, true);
    };

    const genreSelect = document.getElementById('genre-select');
    if (genreSelect) genreSelect.onchange = (e) => {
        currentGenreId = e.target.value;
        currentCategory = currentGenreId ? 'genre' : 'featured';
        if (!currentGenreId) document.querySelector('.category-pill[data-cat="featured"]').classList.add('active');
        else document.querySelectorAll('.category-pill').forEach(b => b.classList.remove('active'));
        currentPage = 1;
        loadMedia();
    };

    let searchTimer;
    if (searchInput) {
        searchInput.oninput = () => {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(searchMedia, 300);
        };
        document.onclick = (e) => {
            if (!searchInput.parentElement.contains(e.target)) suggestions?.classList.remove('show');
        };
    }
});

function switchTab(tab) {
    if (currentTab === tab) return;
    currentTab = tab;
    document.getElementById('movies-tab').classList.toggle('active', tab === 'movies');
    document.getElementById('tv-tab').classList.toggle('active', tab === 'tv');
    loadGenres();
    currentPage = 1;
    loadMedia();
}

async function loadGenres() {
    const type = currentTab === 'movies' ? 'movie' : 'tv';
    const select = document.getElementById('genre-select');
    if (!select) return;

    try {
        const res = await fetch(`https://api.themoviedb.org/3/genre/${type}/list?api_key=${API_KEY}`);
        const data = await res.json();
        select.innerHTML = '<option value="">All Genres</option>' +
            data.genres.map(g => `<option value="${g.id}">${g.name}</option>`).join('');
    } catch (e) { console.error(e); }
}

async function loadMedia(page = 1, append = false) {
    if (isLoading) return;
    isLoading = true;

    if (!append) grid.innerHTML = Array(12).fill('<div class="media-card"><div class="skeleton"></div></div>').join('');
    else document.querySelector('.load-more-card')?.remove();

    try {
        let results = [];
        let hasNext = false;

        if (currentCategory === 'featured' && !currentGenreId && page === 1) {
            results = [...FEATURED];
        } else {
            const type = currentTab === 'movies' ? 'movie' : 'tv';
            const base = `https://api.themoviedb.org/3`;
            let url = `${base}/discover/${type}?api_key=${API_KEY}&page=${page}&vote_count.gte=100&sort_by=popularity.desc`;

            if (currentGenreId) url += `&with_genres=${currentGenreId}`;
            else if (currentCategory === 'popular') url = `${base}/${type}/popular?api_key=${API_KEY}&page=${page}`;
            else if (currentCategory === 'top_rated') url = `${base}/${type}/top_rated?api_key=${API_KEY}&page=${page}`;
            else if (currentCategory === 'upcoming' && type === 'movie') url = `${base}/movie/upcoming?api_key=${API_KEY}&page=${page}`;

            const res = await fetch(url);
            const data = await res.json();
            results = data.results;
            hasNext = data.page < data.total_pages;
        }

        renderGrid(results, append, hasNext);
    } catch (e) {
        console.error(e);
        if (!append) grid.innerHTML = '<div class="error-msg">Failed to load content.</div>';
    } finally {
        isLoading = false;
    }
}

function renderGrid(items, append = false, showLoadMore = false) {
    if (!append) grid.innerHTML = '';

    items.filter(m => m.poster_path).forEach(item => {
        const card = document.createElement('div');
        card.className = 'media-card';
        const title = item.title || item.name;
        const year = (item.release_date || item.first_air_date || '').split('-')[0];

        card.innerHTML = `
            <img src="${IMG_BASE}${item.poster_path}" loading="lazy" alt="${title}">
            <div class="media-card-overlay">
                <div class="media-card-overview">${item.overview || ''}</div>
                <div class="media-card-info">
                    <div class="media-card-title">${title}</div>
                    <div class="media-card-meta">${year}</div>
                </div>
            </div>
            ${item.vote_average ? `<div class="media-card-rating">${item.vote_average.toFixed(1)}/10</div>` : ''}
        `;

        card.onclick = () => {
            if (currentTab === 'tv' || item.media_type === 'tv') openSeasonExplorer(item);
            else playMedia(item, 'movie');
        };
        grid.appendChild(card);
    });

    if (showLoadMore) {
        const more = document.createElement('div');
        more.className = 'media-card load-more-card';
        more.innerHTML = '<div class="load-more-content"><i class="fa-solid fa-plus"></i><span>Load More</span></div>';
        more.onclick = () => { currentPage++; loadMedia(currentPage, true); };
        grid.appendChild(more);
    }
}

function playMedia(item, type) {
    const params = new URLSearchParams({
        type,
        id: item.id,
        title: item.title || item.name
    });
    if (type === 'tv') {
        params.append('season', item.season || 1);
        params.append('episode', item.episode || 1);
    }
    sessionStorage.setItem('currentMovie', JSON.stringify(item));
    window.location.href = `player.html?${params.toString()}`;
}

async function searchMedia() {
    const query = searchInput.value.trim();
    if (query.length < 2) { suggestions?.classList.remove('show'); return; }

    try {
        const res = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}`);
        const data = await res.json();
        const results = data.results.filter(r => (r.media_type === 'movie' || r.media_type === 'tv') && r.poster_path).slice(0, 6);

        if (suggestions) {
            suggestions.innerHTML = results.map(item => `
                <div class="suggestion-item" onclick="handleSuggestionClick(${item.id}, '${item.media_type}')">
                    <img src="${IMG_BASE}${item.poster_path}">
                    <div class="suggestion-info">
                        <div class="suggestion-title">${item.title || item.name}</div>
                        <div class="suggestion-meta">${item.media_type.toUpperCase()} • ${(item.release_date || item.first_air_date || '').split('-')[0]}</div>
                    </div>
                </div>
            `).join('');
            suggestions.classList.toggle('show', results.length > 0);
        }
    } catch (e) { }
}

window.handleSuggestionClick = async (id, type) => {
    const res = await fetch(`https://api.themoviedb.org/3/${type}/${id}?api_key=${API_KEY}`);
    const item = await res.json();
    if (type === 'tv') openSeasonExplorer(item);
    else playMedia(item, 'movie');
};

async function openSeasonExplorer(show) {
    currentShow = show;
    document.getElementById('show-title').textContent = show.name;
    document.getElementById('seasons-list').innerHTML = '<span>Loading seasons...</span>';
    document.getElementById('episodes-list').innerHTML = '';
    document.getElementById('season-explorer').classList.add('show');

    try {
        const res = await fetch(`https://api.themoviedb.org/3/tv/${show.id}?api_key=${API_KEY}`);
        const data = await res.json();
        const seasons = data.seasons.filter(s => s.season_number > 0);

        document.getElementById('seasons-list').innerHTML = seasons.map((s, i) =>
            `<button class="season-btn ${i === 0 ? 'active' : ''}" onclick="loadEpisodes(${show.id}, ${s.season_number}, this)">Season ${s.season_number}</button>`
        ).join('');

        if (seasons.length) loadEpisodes(show.id, seasons[0].season_number);
    } catch (e) { }
}

window.loadEpisodes = async (showId, season, btn) => {
    if (btn) {
        document.querySelectorAll('.season-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }
    document.getElementById('episodes-list').innerHTML = '<span>Loading episodes...</span>';

    try {
        const res = await fetch(`https://api.themoviedb.org/3/tv/${showId}/season/${season}?api_key=${API_KEY}`);
        const data = await res.json();
        document.getElementById('episodes-list').innerHTML = data.episodes.map(ep => `
            <button class="episode-btn" onclick="playEpisode(${season}, ${ep.episode_number}, '${ep.name}')">
                <strong>E${ep.episode_number}</strong> ${ep.name}
            </button>
        `).join('');
    } catch (e) { }
};

window.playEpisode = (season, episode, name) => {
    document.getElementById('season-explorer').classList.remove('show');
    playMedia({ ...currentShow, season, episode, episodeName: name }, 'tv');
};

window.closeSeasonExplorer = () => document.getElementById('season-explorer').classList.remove('show');
