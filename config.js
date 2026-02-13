/**
 * Phantom Unblocked - A feature-rich unblocked games platform.
 * Copyright (C) 2026 Phantom.
 * Licensed under the PolyForm Noncommercial License 1.0.0.
 */

// site config

window.SITE_CONFIG = {
    name: "Phantom",
    fullName: "Phantom Unblocked",
    version: "1.1.2",

    changelog: [
        "made a worker for youtube search**",
        "added music miniplayer",
        "reorganized settings page",
        "added a custom online counter",
        "fixxed games sorting and added trending option",
        "added saving for custom themes",
        "refined proxy - added libcurl support and more",
        "added proxy settings to settings page",
        "added small offline support to allow playing games without wifi",
        "made loading screen not show during click to launch",
        "**Added Autoupdating links in Credits**",
        "fixed blob tab launching",
        "**Join the Discord Lil Bro**",
        "added announcements back",
        "maybe fixxed miniplayer forcing you to go to a new song to work",
        "added announcement source selector",
        "Added ambiance to movies and games and such (might remove)",
        "added twitch chat to twitch",
        "added continue watching and recently played",
        "optimized page code slightly",
        "fixxed/updated ugs games",
        "updated license",
        "many small changes and fixxes",

    ],

    // quotes
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

    // todo
    // *** for strikethrough
    // ** for bold
    todos: [
        "***add custom users counter***",
        "***add more sources for movies and fix autoswitch***",
        "***make ambiance be on by default***",
        "***make ai chat icons be bigger***",
        "***make ai chat text backgrounds more visible***",
        "***fixed ai chat latex***",
        "***fix blob tab***",
        "***make the default song be lebron***",
        "***add continue watching and recently played***",
        "***fix proxy constantly asking skip?***",
        "***fix loading times***",
        "***remove .workers.dev from player.html urls***",
        "***fix tv shows endpoints for player.html***",
        "***fixxed aboutblank opening while securly is on (previously if popups were off it would load intab instead of clickto launch now it will use clicktolaunch unless popups are blocked)***",
        "***add a miniplayer for music***",
    ],
    defaultWisp: "wss://glseries.net/wisp/",
    wispServers: [
        { name: "GLSeries's Wisp", url: "wss://glseries.net/wisp/" },
        { name: "Anura's Wisp", url: "wss://anura.mercurywork.shop/" },
        { name: "Rhw's Wisp", url: "wss://wisp.rhw.one/" },
    ],

    discord: {
        inviteUrl: "https://discord.gg/tHWx9NXp5p",
        widgetServer: "1447673724017971324",
        widgetChannel: "1447673726228496617",
    },

    firstVisitCloak: false, //fake error page
    defaults: {
        cloakMode: "about:blank",
        selectedCloakPreset: "Quiz",
        cloakRotation: false,
        cloakInterval: 5000,
        panicKey: "x",
        panicModifiers: ["ctrl", "shift"],
        panicUrl: "https://classroom.google.com",
        maxMovieRating: "R",
        gameLibrary: "multi",
        discordWidget: true,
        miniplayer: true,
        leaveConfirmation: false,
        showChangelogOnUpdate: true,
        themeRotation: false,
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
        proxServer: 'wss://glseries.net/wisp/',
        historyEnabled: true,
        autoSwitchProviders: true,
        autoLaunch: true, // i forgot what this does 
    },

    announcement: {
        useCDN: false,
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

    backgroundPresets: [ //active: true }, makes background the default
        { id: 'none', name: 'None (Theme Default)', type: 'none' },
        { id: 'Night sky', name: 'Night sky', type: 'image', url: 'https://images.pexels.com/photos/5675745/pexels-photo-5675745.jpeg', overlay: 0.3 },
        { id: 'winter-mountains', name: 'Winter mountains', type: 'image', url: 'https://images.pexels.com/photos/1287145/pexels-photo-1287145.jpeg', overlay: 0.3 },
        { id: 'f1 car', name: 'F1 Car', type: 'image', url: 'https://images.pexels.com/photos/14401632/pexels-photo-14401632.jpeg', overlay: 0.3 },
        { id: 'moon-landing', name: 'Moon Landing', type: 'image', url: 'https://images.pexels.com/photos/41162/moon-landing-apollo-11-nasa-buzz-aldrin-41162.jpeg', overlay: 0.3, objectPosition: 'top left' },
        { id: 'turtle', name: 'Turtle', type: 'image', url: 'https://images.unsplash.com/photo-1501791187590-9ef2612ba1eb?q=80&w=1932&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', overlay: 0.3, active: true },
        { id: 'road', name: 'Road', type: 'image', url: 'https://images.unsplash.com/photo-1508233620467-f79f1e317a05', overlay: 0.3 },
        { id: 'railroad', name: 'Railroad', type: 'image', url: 'https://images.unsplash.com/photo-1505832018823-50331d70d237', overlay: 0.3 },
        { id: 'mountain', name: 'Mountain', type: 'image', url: 'https://raw.githubusercontent.com/evanhnry/brave-wallpapers/refs/heads/main/Brave/clay-banks-u27Rrbs9Dwc-unsplash.jpg', overlay: 0.3 },
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
    ]
}
