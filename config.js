// site config

window.SITE_CONFIG = {
    name: "Phantom",
    fullName: "Phantom Unblocked",
    version: "1.0.12",

    changelog: [
        "1.0.12: tiny fixxes and changes",
        "some code consolidation and fixxes",
        "suggest features in the discord server"
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
        "***fix the proxy***",
        "***fix panic panickey, add quote talking about it***",
        "***fix theatermode, make it hide buttons after a few seconds and ensure all content is being displayed and move the description to the bottom***",
        "***change back player to use old styling, change the surface to use background colors for the bottom part where description is shown, looking just like the background***",
        "***add image and video support for backgrounds***",
        "***fix aichat, make the title use the same ai request as the users question unless its in image mode where it will use text mode and fix ai chat to remember modes better***",
        "***add cloaking to quotes***",
        "***add a default cloak and fix it so icons work in aboutblank for whatever reason they only work when you go to settings in aboutblank where it correctly applies***",
        "***for search suggestions add highlighting for whatever will happen when you click enter, in search suggestions fix all games not sending you to the games page***",
        "***fix games to make multi library the default, put it in config.js***",
        "**rename movies shortcut in index2.html to primeshows, add shortcuts to main pages in the topbar and change the current shortcuts to more popular games**",
        "***make announcements show even on first visit unlike changelog and allow disabling it via settings***",
        "***fix leave comformation asking u to leave each time you click something***",
        "***change the shortcuts on the main page to include pages***",
        "***add movies to the search bar in main page***",
        "***fix background not turning off soon***",
        "**fix music page to hide youtube player unless toggled via 3 dot small button, and always shown on proxy mode, fix all the controls for video time, volume**",
        "**add singlefile using cdns for each page so it autoupdates and is easy enough to make**",
        "**advertise phantom (too much work tbh)**",
        "**add a watch page for youtube and twitch**",
        "**add a miniplayer for music**",
        "***shorten some page's code***",
        "**fix paths in search autocomplete**",
        "**fix markdown in ai not using correct text colors**",
        "**make backgrounds show in the loading screen**",
        "**fix icons for topbar in code.html**",
        "**fix wisp server not notifying or autoswitiching when offline in proxy**",
        "**fix code runner open not working at all**",
        "**make backgrounds show in player.html**",
        "**make backgrounds show in staticsjv2**",
        "***make player.html player controls use theme colros not hardcoded***",
        "***make ai chat and music sidebar go all the way down and up with borders***",
        "**make the only song in music be lebron lebron lebron james**",
        "***finish extra page into credits and make this todo be tucked away somewhere and not the main part of it***"
    ],
    defaultWisp: "wss://glseries.net/wisp/",
    wispServers: [
        { name: "GLSeries Wisp", url: "wss://glseries.net/wisp/" },
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
        tabTitle: "You've already responded",
        tabFavicon: "https://ssl.gstatic.com/docs/spreadsheets/forms/forms_icon_2023q4.ico",
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
    },

    themePresets: {
        dark: { name: 'Dark (Default)', bg: { type: 'color', value: '#0a0a0a' }, surface: '#0f0f0f', surfaceHover: '#1a1a1a', surfaceActive: '#252525', secondary: '#2e2e33', border: '#2a2a2a', borderLight: '#2a2a2a', text: '#e4e4e7', textSec: '#71717a', textDim: '#52525b', accent: '#ffffff' },
        midnight: { name: 'Midnight', bg: { type: 'color', value: '#000000' }, surface: '#050505', surfaceHover: '#111111', surfaceActive: '#1a1a1a', secondary: '#111111', border: '#1a1a1a', borderLight: '#111111', text: '#ededed', textSec: '#a3a3a3', textDim: '#737373', accent: '#d4d4d4' },
        abyss: { name: 'Abyss', bg: { type: 'color', value: '#020617' }, surface: '#0f172a', surfaceHover: '#1e293b', surfaceActive: '#334155', secondary: '#1e293b', border: '#1e293b', borderLight: '#1e293b', text: '#f1f5f9', textSec: '#94a3b8', textDim: '#64748b', accent: '#38bdf8' },
        phantom: { name: 'Phantom', bg: { type: 'color', value: '#0f0a14' }, surface: '#1a0f24', surfaceHover: '#2e1a40', surfaceActive: '#4c2a5c', secondary: '#2e1a40', border: '#2e1a40', borderLight: '#2e1a40', text: '#f3e8ff', textSec: '#d8b4fe', textDim: '#c084fc', accent: '#c084fc' },
        rosepine: { name: 'Rose Pine', bg: { type: 'color', value: '#191724' }, surface: '#1f1d2e', surfaceHover: '#26233a', surfaceActive: '#524f67', secondary: '#26233a', border: '#26233a', borderLight: '#1f1d2e', text: '#e0def4', textSec: '#908caa', textDim: '#6e6a86', accent: '#ebbcba' },
        ocean: { name: 'Oceanic', bg: { type: 'color', value: '#011627' }, surface: '#0b2942', surfaceHover: '#1d3b53', surfaceActive: '#2d4b63', secondary: '#0b2942', border: '#1d3b53', borderLight: '#0b2942', text: '#d6deeb', textSec: '#5f7e97', textDim: '#011627', accent: '#7fdbca' },
        forest: { name: 'Forest', bg: { type: 'color', value: '#020d06' }, surface: '#051a0d', surfaceHover: '#0a2e17', surfaceActive: '#0f4221', secondary: '#051a0d', border: '#0a2e17', borderLight: '#051a0d', text: '#ecfdf5', textSec: '#6ee7b7', textDim: '#064e3b', accent: '#10b981' },
        crimson: { name: 'Crimson', bg: { type: 'color', value: '#1a0505' }, surface: '#230a0a', surfaceHover: '#7b0a0aff', surfaceActive: '#7f1d1d', secondary: '#230a0a', border: '#480f0fff', borderLight: '#230a0a', text: '#fef2f2', textSec: '#fecaca', textDim: '#450a0a', accent: '#ef4444' },
        flame: { name: 'Flame', bg: { type: 'color', value: '#0c0202' }, surface: '#1c0a0a', surfaceHover: '#451a03', surfaceActive: '#9a3412', secondary: '#1c0a0a', border: '#451a03', borderLight: '#9a3412', text: '#fff7ed', textSec: '#fdba74', textDim: '#ea580c', accent: '#f59e0b' }
    },

    backgroundPresets: [
        { id: 'none', name: 'None (Theme Default)', type: 'none' },
        { id: 'Night sky', name: 'Night sky', type: 'image', url: 'https://images.pexels.com/photos/5675745/pexels-photo-5675745.jpeg', overlay: 0.3 },
        { id: 'winter-mountains', name: 'Winter mountains', type: 'image', url: 'https://images.pexels.com/photos/1287145/pexels-photo-1287145.jpeg', overlay: 0.3 },
        { id: 'f1 car', name: 'F1 Car', type: 'image', url: 'https://images.pexels.com/photos/14401632/pexels-photo-14401632.jpeg', overlay: 0.3 },
        { id: 'moon-landing', name: 'Moon Landing', type: 'image', url: 'https://images.pexels.com/photos/41162/moon-landing-apollo-11-nasa-buzz-aldrin-41162.jpeg', overlay: 0.3, objectPosition: 'top left', active: true },
        { id: 'turtle', name: 'Turtle', type: 'image', url: 'https://images.unsplash.com/photo-1501791187590-9ef2612ba1eb?q=80&w=1932&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', overlay: 0.3 },
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
        { name: "nothing", icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", title: "\u200B" },
    ]
}


