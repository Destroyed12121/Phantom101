const ZONES_1_URL = "https://cdn.jsdelivr.net/gh/gn-math/assets@latest/zones.json";
const HTML_PREFIX_1 = "https://cdn.jsdelivr.net/gh/gn-math/html@main";
const COVER_PREFIX_1 = "https://cdn.jsdelivr.net/gh/gn-math/covers@main";
const UGS_PREFIX = "https://cdn.jsdelivr.net/gh/bubbls/ugs-singlefile/UGS-Files/";
const PETEZAH_PREFIX = "https://cdn.jsdelivr.net/gh/PeteZah-Games/Games-lib@main/";
const PETEZAH_IMG_PREFIX = "https://cdn.jsdelivr.net/gh/PeteZah-Games/PeteZahGames@main/public/storage/images/";

const IMAGE_MAP = {"2048":"main/2048.jpg","1v1lol":"main/1v1.jpg","5b":"main3/5b.png","DogeMiner":"main/doge.jpg","ResentCli":"main/resent.jpeg","adofai":"main/ai.png","agar":"main/agar.jpg","age-of-war":"main/geo.jpeg","animal-arena":"main3/animalarena.png","animals-volleyball":"main3/animalsvolleyball.png","armed-forces-io":"main3/armedforcesio.png","arras":"main/arras.jpg","awesometanks2":"main/awesome.jpg","bacon-may-die":"main3/baconmaydie.png","ball-dodge":"main3/balldodge.png","bank-robbery-2":"main3/bankrobbery2.png","bank-robbery-3":"main3/bankrobbery3.png","bank-robbery":"main3/bankrobbery.png","basket-random":"main3/basketrandom.png","basketball-stars":"main/basket.jpg","basketbros-io":"main/basket.jpg","basketrandom":"main3/basketrandom.png","battle-wheels":"main3/battlewheels.png","bitlife":"main/bitlife.jpg","blocky-snakes":"main/blocky.jpg","bloonstd":"main/bloons.jpg","bloonstd2":"main/bloons.jpg","bloonstd3":"main/bloons.jpg","bloonstd4":"main/bloons.jpg","blumgi-ball":"main3/blumgiball.png","blumgi-bloom":"main3/blumgibloom.png","blumgi-castle":"main3/blumgicastle.png","blumgi-dragon":"main3/blumgidragon.png","blumgi-paintball":"main3/blumgipaintball.png","blumgi-racers":"main3/blumgiracers.png","blumgi-rocket":"main3/blumgirocket.png","blumgi-slime":"main3/blumgislime.png","blumgi-soccer":"main3/blumgisoccer.png","bobble":"main3/bobble.png","bounceback":"main/back.jpeg","bowmasters":"main/bowmasters.jpeg","boxing-random":"main/boxingrandom.jpg","brawlstars":"main/brawlstars.jpg","breaking-the-bank":"main3/breakingthebank.png","breakingthebank":"main3/breakingthebank.png","buenos-aires":"main3/buenosaires.png","buildnowgg":"main/buildnow.jpeg","bullet-bros":"main3/bulletbros.png","candy-crush":"main3/candycrush.png","chicago":"main3/chicago.png","chicken-merge-2":"main3/chickenmerge2.png","chicken-merge":"main3/chickenmerge.png","choppy-orc":"main3/choppyorc.png","clash-royale":"main/clash.jpeg","cluster-rush":"main3/clusterrush.png","cookie-clicker":"main3/cookieclicker.png","cookieclicker":"main3/cookieclicker.png","core-ball":"main3/coreball.png","cow-bay":"main3/cowbay.png","crazy-bikes":"main3/crazybikes.png","crazy-cars":"main3/crazycars.png","crazy-cattle-3d":"main3/crazycattle3d.png","crossy-road":"main3/crossyroad.png","crushed-adventures":"main/crushed-ad.png","crusherclicker":"main/crusherclicker.jpg","csgo-clicker":"main3/csgoclicker.png","csgoclicker":"main3/csgoclicker.png","dadish-2":"main3/dadish2.png","dadish-3":"main3/dadish3.png","dadish-3d":"main3/dadish3d.png","dadish":"main3/dadish.png","day-of-meat-castle":"main3/dayofmeatcastle.png","day-of-meat-radiation":"main3/dayofmeatradiation.png","death-run-3d":"main/death.jpg","diggy":"main/diggy.jprg.jpeg","doors-online":"main3/doorsonline.png","double-panda":"main3/doublepanda.png","dreadhead-parkour":"main3/dreadheadparkour.png","drift-boss":"main3/driftboss.png","drive-mad":"main3/drivemad.png","ducklings-io":"main3/ducklingsio.png","dune":"main3/dune.png","eclicker":"main3/cookieclicker.png","economical-2":"main3/economical2.png","economical":"main3/economical.png","eggycar":"main/eggy.jpg","escaping-the-prison":"main3/escapingtheprison.png","fallenlondon":"main/fallenlondon.jpg","fantasy-fest":"main3/fantasyfest.png","fleeing-the-complex":"main3/fleeingthecomplex.png","flip-bros":"main3/flipbros.png","fortnight":"main/fakefortnight.jpg","four-colors":"main3/fourcolors.png","funny-shooter-2":"main/funnyshooter2.jpg","funnyshooter":"main/funnyshooter.jpg","geofs":"main/geofs.jpg","geometry-dash":"main3/geometrydash.png","geometrydash":"main3/geometrydash.png","geometrydash2":"main/geo.jpeg","getawayshootout":"main/getaway.jpg","gladi":"main/gladi.jpg","gladihoppers":"main3/gladihoppers.png","gobattle":"main3/gobattle.png","gobble":"main3/gobble.png","gold-digger-fr-vr":"main3/golddiggerfrvr.png","goober-world":"main3/gooberworld.png","google-snake":"main/snake.jpg","greece-love-odyssey":"main3/greeceloveodyssey.png","gta":"main/gta.jpg","gunmayhem2":"main/gun.jpg","gunmayhemredux":"main/gun.jpg","happy-wheels":"main3/happywheels.png","hawaii":"main3/hawaii.png","hexa":"main/hexa.jpg","hextris":"main/hextris.png","highway-racer":"main/highway-racer.jpeg","holeio":"main/hole.jpg","houseofhazards":"main/houseofhazards.jpg","idle-breakout":"main3/idlebreakout.png","idle-farming-business":"main3/idlefarmingbusiness.png","idle-gang":"main3/idlegang.png","idle-light-city":"main3/idlelightcity.png","idle-mining-empire":"main3/idleminingempire.png","idle-startup-tycoon":"main3/idlestartuptycoon.png","infiltrating-the-airship":"main3/infiltratingtheairship.png","infinitecraft":"main/infinitec.jpg","iron-snout":"main3/ironsnout.png","jacksmith":"main3/jacksmith.png","jelly-drift":"main/jelly.jpeg","jump-only":"main3/jumponly.png","justfalllol":"main3/justfalllol.png","kartwars":"main/kart.jpg","kour":"main/kour.jpg","ks-2-teams":"main3/ks2teams.png","level-devil":"main3/leveldevil.png","littlealchemy":"main/alchemy.jpg","littlealchemy2":"main/alchemy.jpg","london":"main/fallenlondon.jpg","ma":"main/10mins.jpg","mario":"main/supermario.jpg","master-checkers":"main3/mastercheckers.png","master-chess":"main3/masterchess.png","merge-the-numbers":"main3/mergethenumbers.png","merge-tycoon":"main3/mergetycoon.png","miniblox":"main/miniblox.jpg","monster-tracks":"main3/monstertracks.png","motox3m-pool":"main/moto.jpg","motox3m-winter":"main/moto.jpg","motox3m":"main/moto.jpg","motox3m2":"main/moto.jpg","motox3m3":"main/moto.jpg","n-gon":"main/ngon.jpg","new-york":"main3/newyork.jpeg","one-chance":"main3/onechance.png","ovo-dimensions":"main3/ovodimensions.png","ovo":"main/ovo.jpg","papas-bakeria":"main/papasbakeria.jpeg","papas-pizeria":"main/papaspizeria.jpeg","paperio":"main/paper.jpg","paperio2":"main3/paperio2.png","papery-planes":"main/paperyplanes.jpg","paperyplanes1":"main/paper.jpg","physibox":"main3/physibox.png","pokemongames":"main/pokemon.jpg","poly-track":"main/polytrack.jpg","polytrack":"main/polytrack.jpg","poor-bunny":"main3/poorbunny.png","poor-eddie":"main3/pooreddie.png","push-your-luck":"main3/pushyourluck.png","race-survival-arena-king":"main3/racesurvivalarenaking.png","racesurvival":"main3/racesurvivalarenaking.png","ragdoll-archers-crazygames":"main/ragdoll.jpg","ragdoll-archers":"main/ragdoll.jpg","ragdoll-hit":"main/ragdoll-hit.jpeg","recoil":"main/recoil.jpg","resent":"main/resent.jpeg","retro-bowl":"main/retrobowl.jpg","retro-highway":"main3/retrohighway.png","rio":"main3/rio.png","rocket-soccer-derby":"main3/rocketsoccerderby.png","rooftop-snipers-2":"main3/rooftopsnipers2.png","rooftop-snipers":"main3/rooftopsnipers.png","rooftopsnipers":"main3/rooftopsnipers.png","rooftopsnipers2":"main3/rooftopsnipers2.png","run-3":"main/run3.jpg","run3":"main/run3.jpg","sausage-flip":"main3/sausageflip.png","seoul":"main3/seoul.png","shadow-trick":"main3/shadowtrick.png","shellshockers":"main/shellshockers.jpg","shellshockersio":"main/shell.jpg","skiddy-taxi":"main3/skiddytaxi.png","sky-riders":"main3/skyriders.png","slither":"main/slitherio.jpg","slope":"main/slope.jpg","slope2":"main/slope2.jpg","slow-roads":"main3/slowroads.png","slowroads":"main3/slowroads.png","smashkarts":"main/kart.jpg","smashy-roads-2":"main/smashy.jpg","smashy-roads":"main/smashy.jpg","smashyroad":"main/smashyroad.webp","snow-rider-3d":"main3/snowrider3d.png","snowbattle":"main/snow.jpeg","snowrider3d":"main3/snowrider3d.png","soccer-random":"main/soccerrandom.jpg","soccer-skills-champions-league":"main3/soccerskillschampionsleague.png","soccer-skills-euro-cup":"main3/soccerskillseurocup.png","soccer-skills-world-cup":"main3/soccerskillsworldcup.png","soccerrandom":"main/soccerrandom.jpg","space-major-miner":"main3/spacemajorminer.png","space-thing":"main3/spacething.png","space-wars-battleground":"main3/spacewarsbattleground.png","spacehuggers":"main/spacehuggers.jpg","spacewaves":"main/spacewaves.jpg","speed-king":"main3/speedking.png","stack":"main3/stack.png","stealing-the-diamond":"main3/stealingthediamond.png","stickman-bike":"main3/stickmanbike.png","stickman-hook-halloween":"main3/stickmanhookhalloween.png","stickman-hook":"main/stickmanhook.jpg","stickslasher":"main/stickslasher.jpg","stumbleguys":"main/stumble.jpg","stuntparadise":"main/stunt.jpg","subway-surfers":"main3/subwaysurfers.png","super-fowlst-2":"main3/superfowlst2.png","super-fowlst":"main3/superfowlst.png","super-liquid-soccer":"main3/superliquidsoccer.png","super-tunnel-rush":"main3/supertunnelrush.png","superhot":"main/superhot.jpg","superstarcar":"main/superstarcar.jpeg","swingo":"main3/swingo.png","table-tennis-world-tour":"main3/tabletennisworldtour.png","tabletennis":"main/tabletennis.jpg","tag":"main3/tag.png","territorial":"main/territorialio.jpg","tetris":"main/tetris.jpg","the-impossible-quiz-2":"main3/theimpossiblequiz2.png","tightrope-theatre":"main3/tightropetheatre.png","time-shooter-2":"main3/timeshooter2.png","time-shooter-3":"main3/timeshooter3.png","tiny-fishing":"main/tinyfishing.jpg","tinyfishing":"main/tinyfishing.jpg","tokyo":"main3/tokyo.png","tomb-of-the-mask":"main3/tombofthemask.png","totm":"main/totm2.jpg","tower-defense-mingling":"main3/towerdefensemingling.png","tunnel-rush-2":"main/tunnelrush2.jpg","tunnelrush":"main/tunnelrush.jpg","turbo-moto-racer":"main3/turbomotoracer.png","under-the-red-sky":"main3/undertheredsky.png","underwater":"main3/underwater.png","unicycle-hero":"main3/unicyclehero.png","unicycle-legend":"main3/unicyclelegend.png","vegas-queens":"main3/vegasqueens.png","venge-io":"main3/vengeio.png","venge":"main3/vengeio.png","vex-3":"main/vex3.jpg","vex-4":"main/vex4.jpg","vex-5":"main/vex5.jpg","vex-6":"main/vex6.jpg","vex-7":"main/vex7.jpg","vex-8":"main3/vex8.png","vex-x3m":"main3/vexx3m.png","vex6":"main/vex6.jpg","volley-random":"main3/volleyrandom.png","water-polo-ragdoll":"main3/waterpoloragdoll.png","watermelon-game":"main3/watermelongame.png","wordle":"main/wordle.jpg","worldg":"main/worldg.jpg","yohoho-io":"main3/yohohoio.png","yohoho":"main3/yohohoio.png","yokai-dungeon":"main3/yokaidungeon.png","zombie-rush":"main3/zombierush.png","zooplop":"main3/zooplop.png"};

const Gloader = {
    CACHE_KEY: 'phantom_games_cache_v3',
    EXPIRY_MS: 7 * 24 * 60 * 60 * 1000,

    async load(lib = 'multi') {
        const cacheKey = `${this.CACHE_KEY}_${lib}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            try {
                const { timestamp, data } = JSON.parse(cached);
                if (Date.now() - timestamp < this.EXPIRY_MS && data.length > 0) {
                    return data;
                }
            } catch (e) {
                console.warn('Cache parse failed', e);
            }
        }

        const games = await this.fetchGames(lib);
        try {
            localStorage.setItem(cacheKey, JSON.stringify({
                timestamp: Date.now(),
                data: games
            }));
        } catch (e) {
            console.warn('Cache write failed (storage full?)', e);
        }
        return games;
    },

    async fetchGames(lib) {
        if (lib === 'petezah') return this.loadPeteZah();
        if (lib === 'gnmath') return this.loadGnmath();
        if (lib === 'ugs') return this.loadUGS();

        const [g, u, p] = await Promise.all([this.loadGnmath(), this.loadUGS(), this.loadPeteZah()]);
        return [...g, ...u, ...p];
    },

    async loadGnmath() {
        try {
            const res = await fetch(ZONES_1_URL);
            const data = await res.json();
            return data.map(g => ({
                name: this.formatName((g.name || g.title).replace('-a.html', '')),
                url: (g.url || g.file)?.replace('{HTML_URL}', HTML_PREFIX_1).replace('-a.html', '.html'),
                img: (g.cover || g.img || g.image)?.replace('{COVER_URL}', COVER_PREFIX_1),
                type: 'gnmath',
                normalized: this.normalize(g.name || g.title),
                developer: g.author || g.developer || '',
                developerLink: g.authorLink || g.developerLink || ''
            }));
        } catch (e) {
            console.error('Gnmath load failed', e);
            return [];
        }
    },

    async loadUGS() {
        if (this._ugsPromise) return this._ugsPromise;

        this._ugsPromise = (async () => {
            try {
                const response = await fetch('https://cdn.jsdelivr.net/gh/bubbls/ugs-singlefile@main/games.js');
                if (!response.ok) throw new Error('CDN response not OK');

                const text = await response.text();
                const match = text.match(/(?:const|let|var)\s+files\s*=\s*(\[[\s\S]*?\]);?/);

                if (match && match[1]) {
                    const files = eval(match[1]);
                    return files.map(file => {
                        const name = file.replace(/^cl/i, '');
                        return {
                            name: this.formatName(name),
                            url: `${UGS_PREFIX}${encodeURIComponent(file.includes('.') ? file : file + '.html')}`,
                            type: 'ugs',
                            normalized: this.normalize(name)
                        };
                    });
                } else {
                    throw new Error('Could not parse files array');
                }
            } catch (error) {
                console.error('[Gloader] UGS load failed:', error);
                return [];
            }
        })();

        return this._ugsPromise;
    },

    loadPeteZah() {
        const list = ["0.5.2","10minutestilldawn","1v1lol","2048","5b","DogeMiner","ResentCli","adofai","agar","age-of-war","angry-sharks","angrybirds","animal-arena","animals-volleyball","armed-forces-io","arras","asmallworldcup","astray","awesometanks2","bacon-may-die","bad-ice-cream-2","bad-ice-cream-3","bad-ice-cream","ball-dodge","bank-robbery-2","bank-robbery-3","bank-robbery","basket-random","basketball-stars","basketbros-io","basketrandom","battle-wheels","bite","bitlife","blockblast","blocky-snakes","bloonstd","bloonstd2","bloonstd3","bloonstd4","bloxorz","blumgi-ball","blumgi-bloom","blumgi-castle","blumgi-dragon","blumgi-paintball","blumgi-racers","blumgi-rocket","blumgi-slime","blumgi-soccer","bobble","bounceback","bowmasters","boxing-random","brawlstars","breaking-the-bank","breakingthebank","btd5","btd6","buckshot-roullete","buenos-aires","buildnowgg","bullet-bros","bulletzio","callofduty","candy-crush","catpad","chicago","chicken-merge-2","chicken-merge","choppy-orc","clash-royale","cluster-rush","cookie-clicker","cookieclicker","core-ball","cow-bay","crazy-bikes","crazy-cars","crazy-cattle-3d","crazygames","creativekillchamber","crossy-road","crushed-adventures","crusherclicker","csgo-clicker","csgoclicker","dadish-2","dadish-3","dadish-3d","dadish","day-of-meat-castle","day-of-meat-radiation","death-run-3d","deepest-sword","dieeeeeep","diggy","doors-online","double-panda","dreadhead-parkour","drift-boss","drive-mad","ducklife","ducklife2","ducklife3","ducklife4","ducklings-io","dune","eclicker","economical-2","economical","eggycar","emulatorjs","escaping-the-prison","fallenlondon","fantasy-fest","fc-25","fc","flappy-bird","fleeing-the-complex","flip-bros","fortnight","four-colors","funny-shooter-2","funnyshooter","geofs","geometry-dash","geometrydash","geometrydash2","getawayshootout","gladi","gladihoppers","gobattle","gobble","gold-digger-fr-vr","goober-world","google-snake","gravity-soccer","greece-love-odyssey","gta","gunmayhem2","gunmayhemredux","guymayhem","happy-wheels","hawaii","hexa","hextris","highway-race2","highway-racer","holeio","houseofhazards","idle-breakout","idle-farming-business","idle-gang","idle-light-city","idle-mining-empire","idle-startup-tycoon","infiltrating-the-airship","infinitecraft","iron-snout","jacksmith","jelly-drift","jump-only","justfalllol","kartwars","kour","krunker","ks-2-teams","level-devil","littlealchemy","littlealchemy2","lolbeans","london","ma","mario","master-checkers","master-chess","melonplayground","merge-the-numbers","merge-tycoon","mine-line","miniblox","monkey-mart","monkeytype-lite","monster-tracks","motox3m-pool","motox3m-winter","motox3m","motox3m2","motox3m3","n-gon","new-york","not-not","one-chance","ovo-dimensions","ovo","papas-bakeria","papas-pizeria","papas-wingeria","paperio","paperio2","papery-planes","paperyplanes1","physibox","pokemongames","poly-track","polytrack","poor-bunny","poor-eddie","push-your-luck","race-survival-arena-king","racesurvival","ragdoll-archers-crazygames","ragdoll-archers","ragdoll-hit","recoil","redball","resent","retro-bowl","retro-highway","rio","roblox","rocket-soccer-derby","rooftop-snipers-2","rooftop-snipers","rooftopsnipers","rooftopsnipers2","run-3","run3","sausage-flip","seoul","shadow-trick","shellshockers","shellshockersio","skiddy-taxi","skribbl","sky-riders","slither","slope","slope2","slow-roads","slowroads","smashkarts","smashy-roads-2","smashy-roads","smashyroad","snow-rider-3d","snowbattle","snowrider3d","soccer-random","soccer-skills-champions-league","soccer-skills-euro-cup","soccer-skills-world-cup","soccerrandom","space-major-miner","space-thing","space-wars-battleground","spacehuggers","spacewaves","speed-king","spidermanvenomsvengence","stack","stealing-the-diamond","stick-merge","stickman-bike","stickman-hook-halloween","stickman-hook","stickslasher","stumbleguys","stuntparadise","style","subway-surfers","super-fowlst-2","super-fowlst","super-liquid-soccer","super-tunnel-rush","superautopets","superhot","superstarcar","swingo","table-tennis-world-tour","tabletennis","tag","territorial","tetris","the-impossible-quiz-2","tightrope-theatre","time-shooter-2","time-shooter-3","tiny-fishing","tinyfishing","tokyo","tomb-of-the-mask","totm","tower-defense-mingling","tunnel-rush-2","tunnelrush","turbo-moto-racer","ultrakill","under-the-red-sky","underwater","unicycle-hero","unicycle-legend","vegas-queens","venge-io","venge","vex-3","vex-4","vex-5","vex-6","vex-7","vex-8","vex-x3m","vex6","volley-random","water-polo-ragdoll","watermelon-game","wordle","worldg","yohoho-io","yohoho","yokai-dungeon","zombie-rush","zombocalypse","zombsroyale","zooplop"];
        return list.map(dir => ({
            name: this.formatName(dir),
            url: `${PETEZAH_PREFIX}${dir}/index.html`,
            img: IMAGE_MAP[dir] ? `${PETEZAH_IMG_PREFIX}${IMAGE_MAP[dir]}` : '',
            type: 'petezah',
            normalized: this.normalize(dir)
        }));
    },

    formatName(name) {
        return name ? name.replace(/\.html$/i, '')
            .replace(/[-_]/g, ' ')
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .replace(/\(\d+\)$/, '')
            .replace(/\b\w/g, l => l.toUpperCase())
            .trim() : '';
    },

    normalize(name) {
        return name ? name.toLowerCase().replace(/[^a-z0-9]/g, '').trim() : '';
    }
};

window.Gloader = Gloader;
