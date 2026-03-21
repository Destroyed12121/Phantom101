const API_KEY = '2713804610e1e236b1cf44bfac3a7776';
const IMG_BASE = 'https://image.tmdb.org/t/p/w300';

const FEATURED_PART1 = [
    {
        "id": 507089,
        "title": "Five Nights at Freddy's",
        "poster_path": "/h3hhfWdBhdb2JLMZprQ1IvBe90h.jpg",
        "release_date": "2023-10-25",
        "vote_average": 7.3,
        "media_type": "movie",
        "overview": "Recently fired and desperate for work, a troubled young man named Mike agrees to take a position as a night security guard at an abandoned theme restaurant: Freddy Fazbear's Pizzeria. But he soon discovers that nothing at Freddy's is what it seems."
    },
    {
        "id": 1228246,
        "title": "Five Nights at Freddy's 2",
        "poster_path": "/udAxQEORq2I5wxI97N2TEqdhzBE.jpg",
        "release_date": "2025-12-03",
        "vote_average": 6.7,
        "media_type": "movie",
        "overview": "One year since the supernatural nightmare at Freddy Fazbear's Pizza, the stories about what transpired there have been twisted into a campy local legend, inspiring the town's first ever Fazfest. With the truth kept from her, Abby sneak out to reconnect with Freddy, Bonnie, Chica, and Foxy, setting into motion a terrifying series of events that will reveal dark secrets about the real origin of Freddy's, and unleash a decades-hidden horror."
    },
    {
        "id": 76600,
        "title": "Avatar: The Way of Water",
        "poster_path": "/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg",
        "release_date": "2022-12-14",
        "vote_average": 7.6,
        "media_type": "movie",
        "overview": "Set more than a decade after the events of the first film, learn the story of the Sully family (Jake, Neytiri, and their kids), the trouble that follows them, the lengths they go to keep each other safe, the battles they fight to stay alive, and the tragedies they endure."
    },
    {
        "id": 677179,
        "title": "Creed III",
        "poster_path": "/cvsXj3I9Q2iyyIo95AecSd1tad7.jpg",
        "release_date": "2023-03-01",
        "vote_average": 7.1,
        "media_type": "movie",
        "overview": "After dominating the boxing world, Adonis Creed has thrived in his career and family life. When a childhood friend and former boxing prodigy, Damian Anderson, resurfaces after serving a long sentence in prison, he is eager to prove that he deserves his shot in the ring. The face-off between former friends is more than just a fight. To settle the score, Adonis must put his future on the line to battle Damian — a fighter with nothing to lose."
    },
    {
        "id": 361743,
        "title": "Top Gun: Maverick",
        "poster_path": "/62HCnUTziyWcpDaBO2i1DX17ljH.jpg",
        "release_date": "2022-05-21",
        "vote_average": 8.2,
        "media_type": "movie",
        "overview": "After more than thirty years of service as one of the Navy’s top aviators, and dodging the advancement in rank that would ground him, Pete “Maverick” Mitchell finds himself training a detachment of TOP GUN graduates for a specialized mission the likes of which no living pilot has ever seen."
    },
    {
        "id": 502356,
        "title": "The Super Mario Bros. Movie",
        "poster_path": "/qNBAXBIQlnOThrVvA6mA2B5ggV6.jpg",
        "release_date": "2023-04-05",
        "vote_average": 7.6,
        "media_type": "movie",
        "overview": "While working underground to fix a water main, Brooklyn plumbers—and brothers—Mario and Luigi are transported down a mysterious pipe and wander into a magical new world. But when the brothers are separated, Mario embarks on an epic quest to find Luigi."
    },
    {
        "id": 693134,
        "title": "Dune: Part Two",
        "poster_path": "/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
        "release_date": "2024-02-27",
        "vote_average": 8.1,
        "media_type": "movie",
        "overview": "Follow the mythic journey of Paul Atreides as he unites with Chani and the Fremen while on a path of revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the known universe, Paul endeavors to prevent a terrible future only he can foresee."
    },
    {
        "id": 872585,
        "title": "Oppenheimer",
        "poster_path": "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
        "release_date": "2023-07-19",
        "vote_average": 8.0,
        "media_type": "movie",
        "overview": "The story of J. Robert Oppenheimer's role in the development of the atomic bomb during World War II."
    },
    {
        "id": 569094,
        "title": "Spider-Man: Across the Spider-Verse",
        "poster_path": "/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg",
        "release_date": "2023-05-31",
        "vote_average": 8.3,
        "media_type": "movie",
        "overview": "After reuniting with Gwen Stacy, Brooklyn’s full-time, friendly neighborhood Spider-Man is catapulted across the Multiverse, where he encounters the Spider Society, a team of Spider-People charged with protecting the Multiverse's very existence. But when the heroes clash on how to handle a new threat, Miles finds himself pitted against the other Spiders and must set out on his own to save those he loves most."
    },
    {
        "id": 157336,
        "title": "Interstellar",
        "poster_path": "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
        "release_date": "2014-11-05",
        "vote_average": 8.5,
        "media_type": "movie",
        "overview": "The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances involved in an interstellar voyage."
    },
    {
        "id": 299534,
        "title": "Avengers: Endgame",
        "poster_path": "/ulzhLuWrPK07P1YkdWQLZnQh1JL.jpg",
        "release_date": "2019-04-24",
        "vote_average": 8.2,
        "media_type": "movie",
        "overview": "After the devastating events of Avengers: Infinity War, the universe is in ruins due to the efforts of the Mad Titan, Thanos. With the help of remaining allies, the Avengers must assemble once more in order to undo Thanos' actions and restore order to the universe once and for all, no matter what consequences may be in store."
    },
    {
        "id": 496243,
        "title": "Parasite",
        "poster_path": "/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
        "release_date": "2019-05-30",
        "vote_average": 8.5,
        "media_type": "movie",
        "overview": "All unemployed, Ki-taek's family takes peculiar interest in the wealthy and glamorous Parks for their livelihood until they get entangled in an unexpected incident."
    },
    {
        "id": 27205,
        "title": "Inception",
        "poster_path": "/xlaY2zyzMfkhk0HSC5VUwzoZPU1.jpg",
        "release_date": "2010-07-15",
        "vote_average": 8.4,
        "media_type": "movie",
        "overview": "Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets is offered a chance to regain his old life as payment for a task considered to be impossible: \"inception\", the implantation of another person's idea into a target's subconscious."
    },
    {
        "id": 155,
        "title": "The Dark Knight",
        "poster_path": "/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
        "release_date": "2008-07-16",
        "vote_average": 8.5,
        "media_type": "movie",
        "overview": "Batman raises the stakes in his war on crime. With the help of Lt. Jim Gordon and District Attorney Harvey Dent, Batman sets out to dismantle the remaining criminal organizations that plague the streets. The partnership proves to be effective, but they soon find themselves prey to a reign of chaos unleashed by a rising criminal mastermind known to the terrified citizens of Gotham as the Joker."
    },
    {
        "id": 634649,
        "title": "Spider-Man: No Way Home",
        "poster_path": "/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg",
        "release_date": "2021-12-15",
        "vote_average": 7.9,
        "media_type": "movie",
        "overview": "Peter Parker is unmasked and no longer able to separate his normal life from the high-stakes of being a super-hero. When he asks for help from Doctor Strange the stakes become even more dangerous, forcing him to discover what it truly means to be Spider-Man."
    },
    {
        "id": 763215,
        "title": "Damsel",
        "poster_path": "/AgHbB9DCE9aE57zkHjSmseszh6e.jpg",
        "release_date": "2024-03-07",
        "vote_average": 7.0,
        "media_type": "movie",
        "overview": "A young woman's marriage to a charming prince turns into a fierce fight for survival when she's offered up as a sacrifice to a fire-breathing dragon."
    },
    {
        "id": 603,
        "title": "The Matrix",
        "poster_path": "/p96dm7sCMn4VYAStA6siNz30G1r.jpg",
        "release_date": "1999-03-31",
        "vote_average": 8.2,
        "media_type": "movie",
        "overview": "Set in the 22nd century, The Matrix tells the story of a computer hacker who joins a group of underground insurgents fighting the vast and powerful computers who now rule the earth."
    },
    {
        "id": 671,
        "title": "Harry Potter and the Philosopher's Stone",
        "poster_path": "/wuMc08IPKEatf9rnMNXvIDxqP4W.jpg",
        "release_date": "2001-11-16",
        "vote_average": 7.9,
        "media_type": "movie",
        "overview": "Harry Potter has lived under the stairs at his aunt and uncle's house his whole life. But on his 11th birthday, he learns he's a powerful wizard—with a place waiting for him at the Hogwarts School of Witchcraft and Wizardry. As he learns to harness his newfound powers with the help of the school's kindly headmaster, Harry uncovers the truth about his parents' deaths—and about the villain who's to blame."
    },
    {
        "id": 575264,
        "title": "Mission: Impossible - Dead Reckoning Part One",
        "poster_path": "/NNxYkU70HPurnNCSiCjYAmacwm.jpg",
        "release_date": "2023-07-08",
        "vote_average": 7.5,
        "media_type": "movie",
        "overview": "Ethan Hunt and his IMF team embark on their most dangerous mission yet: To track down a terrifying new weapon that threatens all of humanity before it falls into the wrong hands. With control of the future and the world's fate at stake and dark forces from Ethan's past closing in, a deadly race around the globe begins. Confronted by a mysterious, all-powerful enemy, Ethan must consider that nothing can matter more than his mission—not even the lives of those he cares about most."
    },
    {
        "id": 385687,
        "title": "Fast X",
        "poster_path": "/fiVW06jE7z9YnO4trhaMEdclSiC.jpg",
        "release_date": "2023-05-17",
        "vote_average": 7.0,
        "media_type": "movie",
        "overview": "Over many missions and against impossible odds, Dom Toretto and his family have outsmarted, out-nerved and outdriven every foe in their path. Now, they confront the most lethal opponent they've ever faced: A terrifying threat emerging from the shadows of the past who's fueled by blood revenge, and who is determined to shatter this family and destroy everything—and everyone—that Dom loves, forever."
    },
    {
        "id": 453395,
        "title": "Doctor Strange in the Multiverse of Madness",
        "poster_path": "/ddJcSKbcp4rKZTmuyWaMhuwcfMz.jpg",
        "release_date": "2022-05-04",
        "vote_average": 7.2,
        "media_type": "movie",
        "overview": "Doctor Strange, with the help of mystical allies both old and new, traverses the mind-bending and dangerous alternate realities of the Multiverse to confront a mysterious new adversary."
    },
    {
        "id": 414906,
        "title": "The Batman",
        "poster_path": "/74xTEgt7R36Fpooo50r9T25onhq.jpg",
        "release_date": "2022-03-01",
        "vote_average": 7.7,
        "media_type": "movie",
        "overview": "In his second year of fighting crime, Batman uncovers corruption in Gotham City that connects to his own family while facing a serial killer known as the Riddler."
    },
    {
        "id": 505642,
        "title": "Black Panther: Wakanda Forever",
        "poster_path": "/sv1xJUazXeYqALzczSZ3O6nkH75.jpg",
        "release_date": "2022-11-09",
        "vote_average": 7.0,
        "media_type": "movie",
        "overview": "Queen Ramonda, Shuri, M’Baku, Okoye and the Dora Milaje fight to protect their nation from intervening world powers in the wake of King T’Challa’s death.  As the Wakandans strive to embrace their next chapter, the heroes must band together with the help of War Dog Nakia and Everett Ross and forge a new path for the kingdom of Wakanda."
    },
    {
        "id": 436270,
        "title": "Black Adam",
        "poster_path": "/rCtreCr4xiYEWDQTebybolIh6Xe.jpg",
        "release_date": "2022-10-19",
        "vote_average": 6.8,
        "media_type": "movie",
        "overview": "Nearly 5,000 years after he was bestowed with the almighty powers of the Egyptian gods—and imprisoned just as quickly—Black Adam is freed from his earthly tomb, ready to unleash his unique form of justice on the modern world."
    },
    {
        "id": 335787,
        "title": "Uncharted",
        "poster_path": "/rJHC1RUORuUhtfNb4Npclx0xnOf.jpg",
        "release_date": "2022-02-10",
        "vote_average": 6.9,
        "media_type": "movie",
        "overview": "A young street-smart, Nathan Drake and his wisecracking partner Victor “Sully” Sullivan embark on a dangerous pursuit of “the greatest treasure never found” while also tracking clues that may lead to Nathan’s long-lost brother."
    },
    {
        "id": 1011985,
        "title": "Kung Fu Panda 4",
        "poster_path": "/kDp1vUBnMpe8ak4rjgl3cLELqjU.jpg",
        "release_date": "2024-03-02",
        "vote_average": 7.0,
        "media_type": "movie",
        "overview": "Po is gearing up to become the spiritual leader of his Valley of Peace, but also needs someone to take his place as Dragon Warrior. As such, he will train a new kung fu practitioner for the spot and will encounter a villain called the Chameleon who conjures villains from the past."
    },
    {
        "id": 934632,
        "title": "Rebel Moon - Part Two: The Scargiver",
        "poster_path": "/95gnJZIk2rEkMO0Ch46x5CVjnms.jpg",
        "release_date": "2024-04-19",
        "vote_average": 6.1,
        "media_type": "movie",
        "overview": "The rebels gear up for battle against the ruthless forces of the Motherworld as unbreakable bonds are forged, heroes emerge — and legends are made."
    },
    {
        "id": 823464,
        "title": "Godzilla x Kong: The New Empire",
        "poster_path": "/z1p34vh7dEOnLDmyCrlUVLuoDzd.jpg",
        "release_date": "2024-03-27",
        "vote_average": 7.0,
        "media_type": "movie",
        "overview": "Following their explosive showdown, Godzilla and Kong must reunite against a colossal undiscovered threat hidden within our world, challenging their very existence – and our own."
    }
];

const FEATURED_PART2 = [
    {
        "id": 609681,
        "title": "The Marvels",
        "poster_path": "/9GBhzXMFjgcZ3FdR9w3bUMMTps5.jpg",
        "release_date": "2023-11-08",
        "vote_average": 5.9,
        "media_type": "movie",
        "overview": "When her duties send her to an anomalous wormhole linked to a Kree revolutionary, Carol's powers become entangled with that of Jersey City super-fan Kamala Khan, aka Ms. Marvel, and Carol's estranged niece, now S.A.B.E.R. astronaut Captain Monica Rambeau. Together, this unlikely trio must team up and learn to work in concert to save the universe."
    },
    {
        "id": 787699,
        "title": "Wonka",
        "poster_path": "/qhb1qOilapbapxWQn9jtRCMwXJF.jpg",
        "release_date": "2023-12-06",
        "vote_average": 7.0,
        "media_type": "movie",
        "overview": "Willy Wonka – chock-full of ideas and determined to change the world one delectable bite at a time – is proof that the best things in life begin with a dream, and if you’re lucky enough to meet Willy Wonka, anything is possible."
    },
    {
        "id": 346698,
        "title": "Barbie",
        "poster_path": "/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg",
        "release_date": "2023-07-19",
        "vote_average": 6.9,
        "media_type": "movie",
        "overview": "Barbie and Ken are having the time of their lives in the colorful and seemingly perfect world of Barbie Land. However, when they get a chance to go to the real world, they soon discover the joys and perils of living among humans."
    },
    {
        "id": 447365,
        "title": "Guardians of the Galaxy Vol. 3",
        "poster_path": "/r2J02Z2OpNTctfOSN1Ydgii51I3.jpg",
        "release_date": "2023-05-03",
        "vote_average": 7.9,
        "media_type": "movie",
        "overview": "Peter Quill, still reeling from the loss of Gamora, must rally his team around him to defend the universe along with protecting one of their own. A mission that, if not completed successfully, could quite possibly lead to the end of the Guardians as we know them."
    },
    {
        "id": 603692,
        "title": "John Wick: Chapter 4",
        "poster_path": "/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg",
        "release_date": "2023-03-22",
        "vote_average": 7.7,
        "media_type": "movie",
        "overview": "With the price on his head ever increasing, John Wick uncovers a path to defeating The High Table. But before he can earn his freedom, Wick must face off against a new enemy with powerful alliances across the globe and forces that turn old friends into foes."
    },
    {
        "id": 475557,
        "title": "Joker",
        "poster_path": "/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg",
        "release_date": "2019-10-01",
        "vote_average": 8.1,
        "media_type": "movie",
        "overview": "During the 1980s, a failed stand-up comedian is driven insane and turns to a life of crime and chaos in Gotham City while becoming an infamous psychopathic crime figure."
    },
    {
        "id": 1726,
        "title": "Iron Man",
        "poster_path": "/78lPtwv72eTNqFW9COBYI0dWDJa.jpg",
        "release_date": "2008-04-30",
        "vote_average": 7.7,
        "media_type": "movie",
        "overview": "After being held captive in an Afghan cave, billionaire engineer Tony Stark creates a unique weaponized suit of armor to fight evil."
    },
    {
        "id": 299536,
        "title": "Avengers: Infinity War",
        "poster_path": "/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg",
        "release_date": "2018-04-25",
        "vote_average": 8.2,
        "media_type": "movie",
        "overview": "As the Avengers and their allies have continued to protect the world from threats too large for any one hero to handle, a new danger has emerged from the cosmic shadows: Thanos. A despot of intergalactic infamy, his goal is to collect all six Infinity Stones, artifacts of unimaginable power, and use them to inflict his twisted will on all of reality."
    },
    {
        "id": 284054,
        "title": "Black Panther",
        "poster_path": "/uxzzxijgPIY7slzFvMotPv8wjKA.jpg",
        "release_date": "2018-02-13",
        "vote_average": 7.4,
        "media_type": "movie",
        "overview": "King T'Challa returns home to the reclusive, technologically advanced African nation of Wakanda to serve as his country's new leader. However, T'Challa soon finds that he is challenged for the throne by factions within his own country as well as without. Using powers reserved to Wakandan kings, T'Challa assumes the Black Panther mantle to join with members of the Dora Milaje (the Wakandan 'special forces') and an American secret agent, to prevent Wakanda from being dragged into a world war."
    },
    {
        "id": 293660,
        "title": "Deadpool",
        "poster_path": "/3E53WEZJqP6aM84D8CckXx4pIHw.jpg",
        "release_date": "2016-02-09",
        "vote_average": 7.6,
        "media_type": "movie",
        "overview": "The origin story of former Special Forces operative turned mercenary Wade Wilson, who, after being subjected to a rogue experiment that leaves him with accelerated healing powers, adopts the alter ego Deadpool. Armed with his new abilities and a dark, twisted sense of humor, Deadpool hunts down the man who nearly destroyed his life."
    },
    {
        "id": 263115,
        "title": "Logan",
        "poster_path": "/fnbjcRDYn6YviCcePDnGdyAkYsB.jpg",
        "release_date": "2017-02-28",
        "vote_average": 7.8,
        "media_type": "movie",
        "overview": "In the near future, a weary Logan cares for an ailing Professor X in a hideout on the Mexican border. But Logan's attempts to hide from the world and his legacy are upended when a young mutant arrives, pursued by dark forces."
    },
    {
        "id": 118340,
        "title": "Guardians of the Galaxy",
        "poster_path": "/r7vmZjiyZw9rpJMQJdXpjgiCOk9.jpg",
        "release_date": "2014-07-30",
        "vote_average": 7.9,
        "media_type": "movie",
        "overview": "Light years from Earth, 26 years after being abducted, Peter Quill finds himself the prime target of a manhunt after discovering an orb wanted by Ronan the Accuser."
    },
    {
        "id": 284053,
        "title": "Thor: Ragnarok",
        "poster_path": "/rzRwTcFvttcN1ZpX2xv4j3tSdJu.jpg",
        "release_date": "2017-10-02",
        "vote_average": 7.6,
        "media_type": "movie",
        "overview": "Thor is imprisoned on the other side of the universe and finds himself in a race against time to get back to Asgard to stop Ragnarok, the destruction of his home-world and the end of Asgardian civilization, at the hands of a powerful new threat, the ruthless Hela."
    },
    {
        "id": 271110,
        "title": "Captain America: Civil War",
        "poster_path": "/rAGiXaUfPzY7CDEyNKUofk3Kw2e.jpg",
        "release_date": "2016-04-27",
        "vote_average": 7.4,
        "media_type": "movie",
        "overview": "Following the events of Age of Ultron, the collective governments of the world pass an act designed to regulate all superhuman activity. This polarizes opinion amongst the Avengers, causing two factions to side with Iron Man or Captain America, which causes an epic battle between former allies."
    },
    {
        "id": 168259,
        "title": "Furious 7",
        "poster_path": "/ktofZ9Htrjiy0P6LEowsDaxd3Ri.jpg",
        "release_date": "2015-04-01",
        "vote_average": 7.2,
        "media_type": "movie",
        "overview": "Deckard Shaw seeks revenge against Dominic Toretto and his family for his comatose brother."
    },
    {
        "id": 519182,
        "title": "Despicable Me 4",
        "poster_path": "/wWba3TaojhK7NdycRhoQpsG0FaH.jpg",
        "release_date": "2024-06-20",
        "vote_average": 7.0,
        "media_type": "movie",
        "overview": "Gru and Lucy and their girls—Margo, Edith and Agnes—welcome a new member to the Gru family, Gru Jr., who is intent on tormenting his dad. Gru also faces a new nemesis in Maxime Le Mal and his femme fatale girlfriend Valentina, forcing the family to go on the run."
    },
    {
        "id": 1022789,
        "title": "Inside Out 2",
        "poster_path": "/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg",
        "release_date": "2024-06-11",
        "vote_average": 7.5,
        "media_type": "movie",
        "overview": "Teenager Riley's mind headquarters is undergoing a sudden demolition to make room for something entirely unexpected: new Emotions! Joy, Sadness, Anger, Fear and Disgust, who’ve long been running a successful operation by all accounts, aren’t sure how to feel when Anxiety shows up. And it looks like she’s not alone."
    },
    {
        "id": 746036,
        "title": "The Fall Guy",
        "poster_path": "/e7olqFmzcIX5c23kX4zSmLPJi8c.jpg",
        "release_date": "2024-04-24",
        "vote_average": 7.0,
        "media_type": "movie",
        "overview": "Fresh off an almost career-ending accident, stuntman Colt Seavers has to track down a missing movie star, solve a conspiracy and try to win back the love of his life while still doing his day job."
    },
    {
        "id": 653346,
        "title": "Kingdom of the Planet of the Apes",
        "poster_path": "/gKkl37BQuKTanygYQG1pyYgLVgf.jpg",
        "release_date": "2024-05-08",
        "vote_average": 7.1,
        "media_type": "movie",
        "overview": "Several generations following Caesar's reign, apes – now the dominant species – live harmoniously while humans have been reduced to living in the shadows. As a new tyrannical ape leader builds his empire, one young ape undertakes a harrowing journey that will cause him to question all he's known about the past and to make choices that will define a future for apes and humans alike."
    },
    {
        "id": 1011985,
        "title": "Kung Fu Panda 4",
        "poster_path": "/kDp1vUBnMpe8ak4rjgl3cLELqjU.jpg",
        "release_date": "2024-03-02",
        "vote_average": 7.0,
        "media_type": "movie",
        "overview": "Po is gearing up to become the spiritual leader of his Valley of Peace, but also needs someone to take his place as Dragon Warrior. As such, he will train a new kung fu practitioner for the spot and will encounter a villain called the Chameleon who conjures villains from the past."
    },
    {
        "id": 969492,
        "title": "Land of Bad",
        "poster_path": "/h3jYanWMEJq6JJsCopy1h7cT2Hs.jpg",
        "release_date": "2024-02-09",
        "vote_average": 7.3,
        "media_type": "movie",
        "overview": "When a Delta Force special ops mission goes terribly wrong, Air Force drone pilot Reaper has 48 hours to remedy what has devolved into a wild rescue operation. With no weapons and no communication other than the drone above, the ground mission suddenly becomes a full-scale battle when the team is discovered by the enemy."
    },
    {
        "id": 940721,
        "title": "Godzilla Minus One",
        "poster_path": "/2E2WTX0TJEflAged6kzErwqX1kt.jpg",
        "release_date": "2023-11-03",
        "vote_average": 7.6,
        "media_type": "movie",
        "overview": "In postwar Japan, Godzilla brings new devastation to an already scorched landscape. With no military intervention or government help in sight, the survivors must join together in the face of despair and fight back against an unrelenting horror."
    },
    {
        "id": 280,
        "title": "Terminator 2: Judgment Day",
        "poster_path": "/jFTVD4XoWQTcg7wdyJKa8PEds5q.jpg",
        "release_date": "1991-07-03",
        "vote_average": 8.1,
        "media_type": "movie",
        "overview": "Ten years after the events of the original, a reprogrammed T-800 is sent back in time to protect young John Connor from the shape-shifting T-1000. Together with his mother Sarah, he fights to stop Skynet from triggering a nuclear apocalypse."
    },
    {
        "id": 792307,
        "title": "Poor Things",
        "poster_path": "/kCGlIMHnOm8JPXq3rXM6c5wMxcT.jpg",
        "release_date": "2023-12-07",
        "vote_average": 7.7,
        "media_type": "movie",
        "overview": "Brought back to life by an unorthodox scientist, a young woman runs off with a lawyer on a whirlwind adventure across the continents. Free from the prejudices of her times, she grows steadfast in her purpose to stand for equality and liberation."
    },
    {
        "id": 572802,
        "title": "Aquaman and the Lost Kingdom",
        "poster_path": "/7lTnXOy0iNtBAdRP3TZvaKJ77F6.jpg",
        "release_date": "2023-12-20",
        "vote_average": 6.5,
        "media_type": "movie",
        "overview": "Black Manta seeks revenge on Aquaman for his father's death. Wielding the Black Trident's power, he becomes a formidable foe. To defend Atlantis, Arthur (Aquaman) forges an alliance with his imprisoned brother. They must protect the kingdom."
    },
    {
        "id": 44264,
        "title": "True Grit",
        "poster_path": "/tCrB8pcjadZjsDk7rleGJaIv78k.jpg",
        "release_date": "2010-12-22",
        "vote_average": 7.3,
        "media_type": "movie",
        "overview": "Following the murder of her father by a hired hand, a 14-year-old farm girl sets out to capture the killer. To aid her, she hires the toughest U.S. Marshal she can find—a man with 'true grit'—Reuben J. 'Rooster' Cogburn."
    },
    {
        "id": 24428,
        "title": "The Avengers",
        "poster_path": "/RYMX2wcKCBAr24UyPD7xwmjaTn.jpg",
        "release_date": "2012-04-25",
        "vote_average": 8.0,
        "media_type": "movie",
        "overview": "When an unexpected enemy emerges and threatens global safety and security, Nick Fury, director of the international peacekeeping agency known as S.H.I.E.L.D., finds himself in need of a team to pull the world back from the brink of disaster. Spanning the globe, a daring recruitment effort begins!"
    },
    {
        "id": 1891,
        "title": "The Empire Strikes Back",
        "poster_path": "/nNAeTmF4CtdSgMDplXTDPOpYzsX.jpg",
        "release_date": "1980-05-20",
        "vote_average": 8.4,
        "media_type": "movie",
        "overview": "The epic saga continues as Luke Skywalker, in hopes of defeating the evil Galactic Empire, learns the ways of the Jedi from aging master Yoda. But Darth Vader is more determined than ever to capture Luke. Meanwhile, rebel leader Princess Leia, cocky Han Solo, Chewbacca, and droids C-3PO and R2-D2 are thrown into various stages of capture, betrayal and despair."
    }
];

const FEATURED = [...FEATURED_PART1, ...FEATURED_PART2];

let currentTab = 'movies';
let currentCategory = 'featured';
let currentGenreId = '';
let currentPage = 1;
let isLoading = false;
let currentShow = null;

const grid = document.getElementById('media-grid');
const searchInput = document.getElementById('search-input');
const suggestions = document.getElementById('suggestions');

document.addEventListener('DOMContentLoaded', () => {
    if (!grid) return;

    loadGenres();
    loadContinueWatching();
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

            // Show/hide sections based on category
            const top10Section = document.getElementById('top10-section');
            const cwSection = document.getElementById('continue-watching-section');
            if (currentCategory === 'my_list') {
                if (top10Section) top10Section.style.display = 'none';
                if (cwSection) cwSection.style.display = 'none';
            } else {
                if (top10Section) top10Section.style.display = 'block';
                loadContinueWatching();
            }

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

    const randomBtn = document.getElementById('random-btn');
    if (randomBtn) {
        randomBtn.onclick = () => {
            const items = grid.querySelectorAll('.media-card:not(.load-more-card):not(.skeleton-card)');
            if (items.length) {
                items[Math.floor(Math.random() * items.length)].click();
            } else {
                if (window.Notify) Notify.info("Random", "Loading items first...");
            }
        };
    }

    setTimeout(() => {
        if (window.Notify) {
            Notify.info("Can't find a movie?", "Try using genres", 6000);
        }
    }, 20000);

    initTop10Tabs();
    initScrollButtons();
    loadTop10('movie');
});

function switchTab(tab) {
    if (currentTab === tab) return;
    currentTab = tab;
    document.getElementById('movies-tab').classList.toggle('active', tab === 'movies');
    document.getElementById('tv-tab').classList.toggle('active', tab === 'tv');
    loadGenres();
    
    // Reset category to featured
    document.querySelectorAll('.category-pill').forEach(b => b.classList.remove('active'));
    document.querySelector('.category-pill[data-cat="featured"]').classList.add('active');
    currentCategory = 'featured';
    currentGenreId = '';
    const genreSelect = document.getElementById('genre-select');
    if (genreSelect) genreSelect.value = '';
    
    currentPage = 1;
    loadMedia();
    loadContinueWatching();
    
    const top10Section = document.getElementById('top10-section');
    if (top10Section) top10Section.style.display = 'block';
    
    const type = tab === 'movies' ? 'movie' : 'series';
    document.querySelectorAll('.top10-tab').forEach(t => t.classList.remove('active'));
    const targetTab = document.querySelector(`.top10-tab[data-type="${type}"]`);
    if(targetTab) targetTab.classList.add('active');
    loadTop10(type);
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
    else {
        document.querySelector('.load-more-card')?.remove();
        grid.insertAdjacentHTML('beforeend', Array(7).fill('<div class="media-card skeleton-card"><div class="skeleton" style="width:100%;height:100%;"></div></div>').join(''));
    }

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
            else if (currentCategory === 'my_list') {
                const list = JSON.parse(localStorage.getItem('my_list') || '[]');
                results = list.filter(item => (currentTab === 'movies' ? item.media_type === 'movie' : item.media_type === 'tv'));

                if (results.length === 0) {
                    grid.innerHTML = `
                        <div class="empty-state">
                            <i class="fa-solid fa-bookmark"></i>
                            <p>Your list is empty. Start adding movies and shows to see them here!</p>
                        </div>
                    `;
                } else {
                    renderGrid(results, false, false);
                }
                isLoading = false;
                return;
            }

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
    else grid.querySelectorAll('.skeleton-card').forEach(s => s.remove());

    items.filter(m => m.poster_path).forEach(item => {
        const card = document.createElement('div');
        card.className = 'media-card';
        const title = item.title || item.name;
        const year = (item.release_date || item.first_air_date || '').split('-')[0];

        const inList = isInMyList(item.id);
        card.innerHTML = `
            <img src="${IMG_BASE}${item.poster_path}" loading="lazy" alt="${title}">
            <div class="list-toggle-btn ${inList ? 'in-list' : ''}" title="${inList ? 'Remove from My List' : 'Add to My List'}">
                <i class="fa-solid ${inList ? 'fa-bookmark' : 'fa-plus'}"></i>
            </div>
            <div class="media-card-overlay">
                <div class="media-card-overview">${item.overview || ''}</div>
                <div class="media-card-info">
                    <div class="media-card-title">${title}</div>
                    <div class="media-card-meta">${year}</div>
                </div>
            </div>
            ${item.vote_average ? `<div class="media-card-rating">${item.vote_average.toFixed(1)}/10</div>` : ''}
        `;

        const listBtn = card.querySelector('.list-toggle-btn');
        listBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleMyList(item);
            const nowInList = isInMyList(item.id);
            listBtn.classList.toggle('in-list', nowInList);
            listBtn.title = nowInList ? 'Remove from My List' : 'Add to My List';
            listBtn.innerHTML = `<i class="fa-solid ${nowInList ? 'fa-bookmark' : 'fa-plus'}"></i>`;
        };

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
    if (item.poster_path) {
        params.append('img', IMG_BASE + item.poster_path);
    }
    sessionStorage.setItem('currentMovie', JSON.stringify(item));
    window.location.href = `player.html?${params.toString()}`;
}

function loadContinueWatching() {
    const history = JSON.parse(localStorage.getItem('continue_watching') || '[]');
    const container = document.getElementById('continue-watching-section');
    const grid = document.getElementById('continue-watching-grid');

    if (!history.length || !container || !grid || (window.Settings && window.Settings.get('historyEnabled') === false)) {
        if (container) container.style.display = 'none';
        return;
    }

    container.style.display = 'block';
    console.log("Loading continue watching", history);
    grid.innerHTML = '';

    history.forEach(item => {
        if (item.type !== 'movie' && item.type !== 'tv') return;

        if (!item.type && !item.url.includes('id=')) return;

        const card = document.createElement('div');
        card.className = 'media-card';
        const title = item.title;
        const thumb = item.img || 'https://via.placeholder.com/300x450?text=No+Preview';

        let meta = 'Resume';
        try {
            const urlObj = new URL(item.url, window.location.origin);
            const s = urlObj.searchParams.get('season');
            const e = urlObj.searchParams.get('episode');
            if (s && e) meta = `S${s} E${e}`;
        } catch (e) { }

        const removeBtn = document.createElement('button');
        removeBtn.innerHTML = '<i class="fa-solid fa-times"></i>';
        removeBtn.style.cssText = 'position:absolute;top:5px;right:5px;background:rgba(0,0,0,0.7);color:#fff;border:none;border-radius:50%;width:24px;height:24px;cursor:pointer;z-index:10;display:flex;align-items:center;justify-content:center;';
        removeBtn.onclick = (e) => {
            e.stopPropagation();
            const newHistory = history.filter(h => h.url !== item.url);
            localStorage.setItem('continue_watching', JSON.stringify(newHistory));
            loadContinueWatching();
        };

        card.innerHTML = `
            <img src="${thumb}" loading="lazy" alt="${title}">
            <div class="media-card-overlay">
                <div class="media-card-info">
                    <div class="media-card-title">${title}</div>
                    <div class="media-card-meta">${meta}</div>
                    ${item.progress ? `<div class="progress-bar-container" style="width:100%;height:3px;background:rgba(255,255,255,0.3);margin-top:4px;border-radius:2px;overflow:hidden;"><div class="progress-bar" style="width:${item.progress.percentage}%;height:100%;background:var(--accent);display:block;"></div></div>` : ''}
                </div>
            </div>
        `;

        card.appendChild(removeBtn);

        card.onclick = () => {
            window.location.href = item.url;
        };
        grid.appendChild(card);
    });
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
                        <div class="suggestion-overview">${item.overview || ''}</div>
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
            <button class="episode-btn" onclick="playMedia({
                id: ${showId},
                title: '${currentShow.name.replace(/'/g, "\\'")}',
                season: ${ep.season_number},
                episode: ${ep.episode_number},
                poster_path: '${currentShow.poster_path}'
            }, 'tv')">
                <span style="color:var(--text);font-weight:700;font-size:1.05rem;">${ep.episode_number}. ${ep.name.replace(/'/g, "\\'")}</span>
                <span style="font-size:0.8rem;color:var(--text-muted);">${ep.runtime ? ep.runtime + ' min' : ''} • ${(ep.air_date || '').split('-')[0]}</span>
                <span style="font-size:0.8rem;line-height:1.4;display:-webkit-box;-webkit-line-clamp:3;line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;opacity:0.8;margin-top:4px;">${ep.overview || 'No overview available.'}</span>
            </button>
        `).join('');
    } catch (e) {
        document.getElementById('episodes-list').innerHTML = '<span>Failed to load episodes.</span>';
    }
};

window.closeSeasonExplorer = () => {
    document.getElementById('season-explorer').classList.remove('show');
};

const RAPID_API_KEY = '2c202bc3d7msh4897b5b2a7d3f0cp15a754jsn568117aaec11';
const RAPID_API_HOST = 'streaming-availability.p.rapidapi.com';
const CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const COUNTRY = 'us';

function getCachedTop10(type) {
    try {
        const raw = localStorage.getItem(`top10_v1_${type}`);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed.data || !Array.isArray(parsed.data) || !parsed.timestamp) {
            localStorage.removeItem(`top10_v1_${type}`);
            return null;
        }
        if (Date.now() - parsed.timestamp > CACHE_DURATION_MS) {
            localStorage.removeItem(`top10_v1_${type}`);
            return null;
        }
        return parsed;
    } catch {
        return null;
    }
}

function setCachedTop10(type, data) {
    try {
        localStorage.setItem(`top10_v1_${type}`, JSON.stringify({ data, timestamp: Date.now() }));
    } catch (e) {}
}

async function fetchServiceTop(service, showType) {
    const url = `https://streaming-availability.p.rapidapi.com/shows/top?country=${COUNTRY}&service=${service}&show_type=${showType}&output_language=en`;
    const res = await fetch(url, {
        method: 'GET',
        headers: {
            'X-RapidAPI-Host': RAPID_API_HOST,
            'X-RapidAPI-Key': RAPID_API_KEY
        }
    });
    if (!res.ok) return [];
    const items = await res.json();
    return Array.isArray(items) ? items : [];
}

async function fetchTop10FromAPI(showType = 'movie') {
    const services = showType === 'series' ? ['netflix'] : ['prime'];
    const results = await Promise.allSettled(
        services.map(s => fetchServiceTop(s, showType))
    );

    const seen = new Set();
    const merged = [];

    for (const result of results) {
        if (result.status !== 'fulfilled') continue;
        for (const show of result.value) {
            const key = show.title || show.id;
            if (seen.has(key)) continue;
            seen.add(key);
            merged.push(show);
        }
    }

    const top10 = merged.slice(0, 10).map((s, i) => ({
        rank: i + 1,
        id: s.tmdbId || s.imdbId || s.id,
        title: s.title,
        overview: s.overview || '',
        year: s.releaseYear || s.firstAirYear || '',
        rating: s.rating ?? null,
        posterUrl: getBestPoster(s),
        type: s.showType
    }));

    const tmdbKey = window.API_KEY || '2713804610e1e236b1cf44bfac3a7776';
    const tmdbType = showType === 'series' ? 'tv' : 'movie';

    await Promise.all(top10.map(async (item) => {
        if (item.id && !isNaN(item.id)) {
            item.tmdb_id = parseInt(item.id);
        } else {
            try {
                const res = await fetch(`https://api.themoviedb.org/3/search/${tmdbType}?api_key=${tmdbKey}&query=${encodeURIComponent(item.title)}`);
                const data = await res.json();
                if (data.results && data.results.length) {
                    item.tmdb_id = data.results[0].id;
                }
            } catch (e) {}
        }
    }));

    return top10;
}

function getBestPoster(show) {
    if (show.imageSet && show.imageSet.verticalPoster) {
        const vp = show.imageSet.verticalPoster;
        if (vp.w360) return vp.w360;
        if (vp.w240) return vp.w240;
        if (vp.w480) return vp.w480;
        const keys = Object.keys(vp).filter(k => k !== 'original' && k.startsWith('w'));
        if (keys.length > 0) {
            return vp[keys.sort((a,b) => parseInt(a.slice(1)) - parseInt(b.slice(1)))[0]];
        }
        return Object.values(vp)[0];
    }
    return '';
}

function renderTop10(items) {
    const track = document.getElementById('top10-track');
    const section = document.getElementById('top10-section');
    if (!track || !section) return;
    if (!items || items.length === 0 || currentCategory === 'my_list') { 
        section.style.display = 'none'; 
        return; 
    }

    section.style.display = 'block';
    track.innerHTML = '';

    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'top10-card';

        let ratingDisplay = '';
        if (item.rating != null) {
            let r = item.rating;
            if (r > 10) r = (r / 10).toFixed(1);
            ratingDisplay = `<div class="top10-card-rating"><i class="fa-solid fa-star"></i> ${r}</div>`;
        }

        const tmdbIdToCheck = item.tmdb_id || item.id;
        const inList = isInMyList(tmdbIdToCheck);
        card.innerHTML = `
            <div class="top10-rank">${item.rank}</div>
            <div class="list-toggle-btn ${inList ? 'in-list' : ''}" title="${inList ? 'Remove from My List' : 'Add to My List'}">
                <i class="fa-solid ${inList ? 'fa-bookmark' : 'fa-plus'}"></i>
            </div>
            <div class="top10-poster-wrap">
                ${item.posterUrl
                    ? `<img class="top10-poster" src="${item.posterUrl}" alt="${item.title}" loading="lazy">`
                    : `<div class="top10-poster top10-poster-placeholder"><i class="fa-solid fa-film"></i></div>`}
                <div class="top10-card-overlay">
                    <div class="top10-card-overview">${item.overview}</div>
                </div>
                ${ratingDisplay}
            </div>
            <div class="top10-card-subtitle">${item.year}</div>
        `;

        const listBtn = card.querySelector('.list-toggle-btn');
        listBtn.onclick = async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const tmdbKey = window.API_KEY || '2713804610e1e236b1cf44bfac3a7776';
            const tmdbType = (item.type === 'series' || item.type === 'tv') ? 'tv' : 'movie';
            
            listBtn.style.opacity = '0.7';
            listBtn.style.pointerEvents = 'none';

            let fullItem = null;
            let lookupId = item.tmdb_id || item.id;

            if (lookupId && !isNaN(lookupId)) {
                try {
                    const res = await fetch(`https://api.themoviedb.org/3/${tmdbType}/${lookupId}?api_key=${tmdbKey}`);
                    if (res.ok) {
                        const data = await res.json();
                        fullItem = { ...data, media_type: tmdbType, title: data.title || data.name, id: data.id };
                    }
                } catch (err) {}
            }

            if (!fullItem) {
                try {
                    const res = await fetch(`https://api.themoviedb.org/3/search/${tmdbType}?api_key=${tmdbKey}&query=${encodeURIComponent(item.title)}`);
                    const data = await res.json();
                    if (data.results && data.results.length) {
                        fullItem = data.results[0];
                        fullItem.media_type = tmdbType;
                    }
                } catch (e) {}
            }

            listBtn.style.opacity = '';
            listBtn.style.pointerEvents = '';

            if (fullItem) {
                item.tmdb_id = fullItem.id;
                toggleMyList(fullItem);
                
                const nowInList = isInMyList(fullItem.id);
                listBtn.classList.toggle('in-list', nowInList);
                listBtn.title = nowInList ? 'Remove from My List' : 'Add to My List';
                listBtn.innerHTML = `<i class="fa-solid ${nowInList ? 'fa-bookmark' : 'fa-plus'}"></i>`;
            } else {
                if (window.Notify) Notify.error("Error", "Could not find details for this item.");
            }
        };

        card.onclick = () => top10CardClick(item);
        track.appendChild(card);
    });
}

async function top10CardClick(item) {
    const tmdbKey = window.API_KEY || '2713804610e1e236b1cf44bfac3a7776';
    const tmdbType = (item.type === 'series' || item.type === 'tv') ? 'tv' : 'movie';

    if (item.id && !isNaN(item.id)) {
        try {
            const res = await fetch(`https://api.themoviedb.org/3/${tmdbType}/${item.id}?api_key=${tmdbKey}`);
            if (res.ok) {
                const tmdb = await res.json();
                if (tmdbType === 'tv') openSeasonExplorer(tmdb);
                else playMedia(tmdb, 'movie');
                return;
            }
        } catch (e) {}
    }

    try {
        const res = await fetch(`https://api.themoviedb.org/3/search/${tmdbType}?api_key=${tmdbKey}&query=${encodeURIComponent(item.title)}`);
        const data = await res.json();
        if (data.results && data.results.length) {
            const best = data.results[0];
            if (tmdbType === 'tv') openSeasonExplorer(best);
            else playMedia(best, 'movie');
        }
    } catch (e) {}
}

async function loadTop10(showType = 'movie') {
    const track = document.getElementById('top10-track');
    const section = document.getElementById('top10-section');
    if (!track || !section) return;

    const cached = getCachedTop10(showType);
    if (cached) {
        renderTop10(cached.data);
        return;
    }

    if (currentCategory !== 'my_list') {
        section.style.display = 'block';
    } else {
        section.style.display = 'none';
        // Continue loading in background so it's ready when they switch back
    }
    track.innerHTML = Array(10).fill(0).map((_, i) => `
        <div class="top10-card top10-card-skeleton">
            <div class="top10-rank skeleton-text-rank">${i + 1}</div>
            <div class="top10-poster-wrap">
                <div class="skeleton" style="width:100%;height:100%;"></div>
            </div>
            <div class="skeleton" style="width:85%;height:12px;margin-top:10px;border-radius:4px;"></div>
            <div class="skeleton" style="width:45%;height:10px;margin-top:6px;border-radius:4px;"></div>
        </div>
    `).join('');

    try {
        const data = await fetchTop10FromAPI(showType);
        if (data && data.length > 0) {
            setCachedTop10(showType, data);
            renderTop10(data);
        } else {
            section.style.display = 'none';
        }
    } catch (err) {
        section.style.display = 'none';
    }
}

function initScrollButtons() {
    const track = document.getElementById('top10-track');
    const left = document.getElementById('top10-scroll-left');
    const right = document.getElementById('top10-scroll-right');
    if (!track || !left || !right) return;

    left.onclick = () => track.scrollBy({ left: -440, behavior: 'smooth' });
    right.onclick = () => track.scrollBy({ left: 440, behavior: 'smooth' });

    const updateArrows = () => {
        left.style.opacity = track.scrollLeft > 10 ? '1' : '0';
        left.style.pointerEvents = track.scrollLeft > 10 ? 'auto' : 'none';
        const max = track.scrollWidth - track.clientWidth;
        right.style.opacity = track.scrollLeft < max - 10 ? '1' : '0';
        right.style.pointerEvents = track.scrollLeft < max - 10 ? 'auto' : 'none';
    };

    track.addEventListener('scroll', updateArrows);
    new ResizeObserver(updateArrows).observe(track);
    setTimeout(updateArrows, 500);
}

function initTop10Tabs() {
    document.querySelectorAll('.top10-tab').forEach(tab => {
        tab.onclick = () => {
            document.querySelectorAll('.top10-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            loadTop10(tab.dataset.type);
        };
    });
}

function isInMyList(id) {
    const list = JSON.parse(localStorage.getItem('my_list') || '[]');
    return list.some(item => Number(item.id) === Number(id));
}

function toggleMyList(item) {
    let list = JSON.parse(localStorage.getItem('my_list') || '[]');
    const index = list.findIndex(i => Number(i.id) === Number(item.id));
    
    if (index > -1) {
        list.splice(index, 1);
        if (window.Notify && window.Notify.info) {
            window.Notify.info("Removed", `${item.title || item.name} removed from My List`);
        } else {
            console.log("Removed from My List");
        }
    } else {
        if (!item.media_type) {
            item.media_type = currentTab === 'movies' ? 'movie' : 'tv';
        }
        list.push(item);
        if (window.Notify && window.Notify.success) {
            window.Notify.success("Added", `${item.title || item.name} added to My List`);
        } else {
            console.log("Added to My List");
        }
    }
    
    localStorage.setItem('my_list', JSON.stringify(list));
    
    if (currentCategory === 'my_list') {
        const updatedList = JSON.parse(localStorage.getItem('my_list') || '[]');
        const results = updatedList.filter(i => (currentTab === 'movies' ? i.media_type === 'movie' : i.media_type === 'tv'));
        if (results.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-bookmark"></i>
                    <p>Your list is empty. Start adding movies and shows to see them here!</p>
                </div>
            `;
        } else {
            renderGrid(results, false, false);
        }
    }
}
