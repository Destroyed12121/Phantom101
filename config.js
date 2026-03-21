window.SITE_CONFIG = {
    name: "Phantom",
    fullName: "Phantom Unblocked",
    version: "1.1.6",

    changelog: [
        "added files and attachment support and much more to Aichat",
        "minor styling changes and improvements to search",
        "revamped search bar in movies and watch page",
        "major improvements to movies including top 10 and my list",
        "fixxed ?unblock mode",
        "improved searching for games and such",
        "added news and weather widgets in the home page",
        "SO MUCH MORE!"
    ],

    quotes: [
        "lebron lebron lebronn james",
        "so tuff",
        "it is what it is",
        "do ur work",
        "this is what happens when u dont touch grass",
        "FULL BOX",
        "FULL PIECE",
        "200!",
        "press esc + refresh + power button for hacks",
        "press ctrl+x to hide your screen",
        "change the tab title and favicon in settings",
        "TEACHERR!",
        "1 pump",
        "303 headshot",
        "bros prolly a 60 ovr",
        "take the L lil bro",
        "lebron is OUR goat",
        "stop looking at my screen",
    ],

    todos: [
        "***make choosing a episode for series in movies look better***",
        "***fix continue watching in movies***",
        "***allow no background as a background in rotation***",
        "***allow ai take screenshots***",
        "***remove platform stream text in player.html***",
        "***fix watch.html subtitle***",
        "***overhaul movies with top 10 movies and tvshows, my list, better theater mode***",
        "***support adding attachments to aichat and allow pictures if possible, allow drag and drop along with selecting***",
        "***make movies havae top 10 in the world***",
        "find hosting outside of surge.sh",
        "***fix ?unblock***",
        "***make libcurl default for embed.html***",
        "***revert/change styling in browser***",
        "***add more games***",
        "***add the weather n news somewhere***",
        "***update movies and watch tab similarly to games***",
        "phantom v2 redo phantom into tabs",
        "add singlefile, genuinely dont know how to do this",
    ],
    defaultWisp: "wss://glseries.net/wisp/",
    wispServers: [
        { name: "Anura's Wisp", url: "wss://anura.mercurywork.shop/" },
        { name: "Glseries's Wisp", url: "wss://glseries.net/wisp/" },
        { name: "Incognito Wisp", url: "wss://incog.works/wisp/" },
    ],

    discord: {
        inviteUrl: "https://discord.gg/tHWx9NXp5p",
        widgetServer: "1447673724017971324",
        widgetChannel: "1447673726228496617",
    },

    firstVisitCloak: false, // fake offline page
    defaults: {
        cloakMode: "about:blank",
        selectedCloakPreset: "Quiz",
        cloakRotation: false,
        cloakInterval: 5000,
        panicKey: "x",
        panicModifiers: ["ctrl"],
        panicUrl: "https://classroom.google.com",
        maxMovieRating: "R",
        gameLibrary: "multi",
        discordWidget: true,
        miniplayer: true,

        showChangelogOnUpdate: true,
        themeRotation: true,
        lastThemeRotation: 0,
        backgroundRotation: true,
        lastBackgroundRotation: 0,
        lastSeenFeatured: 'none',
        background: { type: 'color', value: '#0a0a0a' },
        customBackground: { id: 'none', type: 'none' },
        accentColor: '#ffffff',
        surfaceColor: '#0f0f0f',
        secondaryColor: '#2e2e33',
        textColor: '#e4e4e7',
        searchEngine: 'https://www.bing.com/search?q=',
        transport: 'epoxy',
        wispAutoswitch: true,
        historyEnabled: true,
        autoSwitchProviders: true,
        autoLaunch: true,
    },

    announcement: {
        message: "",
    },

    themePresets: {
        dark: { name: 'Dark (Default)', bg: { type: 'color', value: '#0a0a0a' }, surface: '#0f0f0f', surfaceHover: '#1a1a1a', surfaceActive: '#252525', secondary: '#2e2e33', border: '#2a2a2a', borderLight: '#2a2a2a', text: '#e4e4e7', textSec: '#71717a', textDim: '#52525b', accent: '#ffffff' },
        midnight: { name: 'Midnight', bg: { type: 'color', value: '#000000' }, surface: '#050505', surfaceHover: '#111111', surfaceActive: '#1a1a1a', secondary: '#111111', border: '#1a1a1a', borderLight: '#111111', text: '#ededed', textSec: '#a3a3a3', textDim: '#737373', accent: '#d4d4d4' },
        abyss: { name: 'Abyss', bg: { type: 'color', value: '#020617' }, surface: '#0f172a', surfaceHover: '#1e293b', surfaceActive: '#334155', secondary: '#1e293b', border: '#1e293b', borderLight: '#1e293b', text: '#f1f5f9', textSec: '#94a3b8', textDim: '#64748b', accent: '#38bdf8' },
        phantom: { name: 'Phantom', bg: { type: 'color', value: '#0f0a14' }, surface: '#1a0f24', surfaceHover: '#2e1a40', surfaceActive: '#4c2a5c', secondary: '#2e1a40', border: '#2e1a40', borderLight: '#2e1a40', text: '#f3e8ff', textSec: '#d8b4fe', textDim: '#c084fc', accent: '#c084fc' },
        catppuccin: { name: 'Catppuccin', bg: { type: 'color', value: '#1e1e2e' }, surface: '#181825', surfaceHover: '#313244', surfaceActive: '#45475a', secondary: '#181825', border: '#313244', borderLight: '#313244', text: '#cdd6f4', textSec: '#a6adc8', textDim: '#7f849c', accent: '#cba6f7' },
        ocean: { name: 'Oceanic', bg: { type: 'color', value: '#011627' }, surface: '#0B1823', surfaceHover: '#1d3b53', surfaceActive: '#2d4b63', secondary: '#0b2942', border: '#1d3b53', borderLight: '#0b2942', text: '#d6deeb', textSec: '#5f7e97', textDim: '#011627', accent: '#7fdbca' },
    },

    backgroundPresets: [
        { id: 'none', name: 'None (Theme Default)', type: 'none' },
        { id: 'f1 car', name: 'F1 Car', type: 'image', url: 'https://images.pexels.com/photos/14401632/pexels-photo-14401632.jpeg', overlay: 0.15 },
        { id: 'moon-landing', name: 'Moon Landing', type: 'image', url: 'https://images.pexels.com/photos/41162/moon-landing-apollo-11-nasa-buzz-aldrin-41162.jpeg', overlay: 0.15, objectPosition: 'top left' },
        { id: 'turtle', name: 'Turtle', type: 'image', url: 'https://images.unsplash.com/photo-1501791187590-9ef2612ba1eb?q=80&w=1932&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', overlay: 0.15, },
        { id: 'road', name: 'Road', type: 'image', url: 'https://images.unsplash.com/photo-1508233620467-f79f1e317a05', overlay: 0.15 },
        { id: 'arena', name: 'Arena', type: 'image', url: 'https://images.pexels.com/photos/4500123/pexels-photo-4500123.jpeg', overlay: 0.15 },
        { id: 'mountain', name: 'Mountain', type: 'image', url: 'https://raw.githubusercontent.com/evanhnry/brave-wallpapers/refs/heads/main/Brave/clay-banks-u27Rrbs9Dwc-unsplash.jpg', overlay: 0.05 },
    ],

    cloakPresets: [
        { name: "Phantom", icon: "/favicon.svg", title: "Phantom Unblocked" },
        { name: "Edpuzzle", icon: "https://edpuzzle.imgix.net/favicons/favicon-32.png", title: "Edpuzzle" },
        { name: "Google Docs", icon: "https://ssl.gstatic.com/docs/documents/images/kix-favicon7.ico", title: "Untitled document - Google Docs" },
        { name: "Canvas", icon: "https://du11hjcvx0uqb.cloudfront.net/dist/images/favicon-e10d657a73.ico", title: "Dashboard" },
        { name: "Desmos", icon: "https://www.desmos.com/favicon.ico", title: "Desmos | Graphing Calculator" },
        { name: "Khan Academy", icon: "https://cdn.kastatic.org/images/favicon.ico", title: "Khan Academy" },
        { name: "Wikipedia", icon: "https://en.wikipedia.org/favicon.ico", title: "World War II - Wikipedia" },
        { name: "Classroom", icon: "https://ssl.gstatic.com/classroom/favicon.png", title: "Home - Classroom" },
        { name: "Canva", icon: "https://static.canva.com/static/images/android-192x192-2.png", title: "Home - Canva" },
        { name: "Quiz", icon: "https://ssl.gstatic.com/docs/spreadsheets/forms/forms_icon_2023q4.ico", title: "You've already responded" },
        { name: "Blooket", icon: "https://play.blooket.com/favicon.ico", title: "Play Blooket | Blooket" },
        { name: "Gmail", icon: "https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico", title: "Gmail" },
        { name: "YouTube", icon: "https://www.youtube.com/favicon.ico", title: "YouTube" },
        { name: "Powerschool", icon: "https://waverlyk12.powerschool.com/favicon.ico", title: "Grades and Attendance" },
        { name: "nothing", icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", title: "​" },
    ],

    news: {
        enabled: true,
        title: "March Madness",
        icon: "fa-basketball",
        date: "2026 03/21",
        prompt: `Today is March 21, 2026. 4 biggest March Madness results from the last 24 hours.
Prioritize upsets, overtime, and buzzer-beaters. Skip boring blowouts unless a low seed caused it.
NEVER use mascot nicknames — always use full school names in both headlines and summaries.
Summaries must add NEW context not in the headline (bracket impact, history, streaks). Never just restate the score.
Only report real, verified results. If unsure, do not include it.
Format: * Headline with seeds and score | Source | Summary under 12 words using school names only.
Example: * (15) Saint Peter's stuns (2) Kentucky 85-79 | ESPN | First 15-seed upset of the tournament.`
    }
}
