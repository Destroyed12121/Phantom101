// ============================================
// SITE CONFIGURATION - PHANTOM UNBLOCKED
// ============================================

window.SITE_CONFIG = {
    name: "Phantom",
    fullName: "Phantom Unblocked",
    version: "1.0.5",

    // Changelog
    changelog: [
        "fixxes to search suggestion",
        "multi library using both libraries",
        "ambience glow and more fixxed",
        "OPEN SOURCE RELEASE https://github.com/Destroyed12121/Phantom101",
        "JOIN THE DISCORD"
    ],

    // Discord
    discord: {
        inviteUrl: "https://discord.gg/tHWx9NXp5p",
        widgetServer: "1447673724017971324",
        widgetChannel: "1447673726228496617",
    },

    firstVisitCloak: false, // this controls the fake error page
    // Default settings
    defaults: {
        cloakMode: "about:blank",
        tabTitle: "Phantom Unblocked",
        tabFavicon: "favicon.svg",
        cloakRotation: false,
        cloakInterval: 5000,
        panicKey: "Escape",
        panicModifiers: ["ctrl", "shift"],
        panicUrl: "https://classroom.google.com",
        maxMovieRating: "R",
        gameLibrary: "lib1",
        discordWidget: true,
        miniplayer: true,
        leaveConfirmation: false,
        showChangelogOnUpdate: true,
        themeRotation: true,
        lastThemeRotation: 0,
    },

    // Theme Presets
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

    // Tab Cloaks
    cloakPresets: [
        { name: "nothing", icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", title: "\u200B" },
        { name: "Edpuzzle", icon: "https://edpuzzle.imgix.net/favicons/favicon-32.png", title: "Edpuzzle" },
        { name: "Google Docs", icon: "https://ssl.gstatic.com/docs/documents/images/kix-favicon7.ico", title: "Untitled document - Google Docs" },
        { name: "Canvas", icon: "https://du11hjcvx0uqb.cloudfront.net/dist/images/favicon-e10d657a73.ico", title: "Dashboard" },
        { name: "Desmos", icon: "https://www.desmos.com/favicon.ico", title: "Desmos | Graphing Calculator" },
        { name: "Khan Academy", icon: "https://cdn.kastatic.org/images/favicon.ico", title: "Khan Academy" },
        { name: "Wikipedia", icon: "https://en.wikipedia.org/favicon.ico", title: "World War II - Wikipedia" },
        { name: "Classroom", icon: "https://ssl.gstatic.com/classroom/favicon.png", title: "Home" },
        { name: "Canva", icon: "https://static.canva.com/static/images/android-192x192-2.png", title: "Home - Canva" },
        { name: "Quiz", icon: "https://ssl.gstatic.com/docs/spreadsheets/forms/forms_icon_2023q4.ico", title: "You've already responded" },
        { name: "Blooket", icon: "https://play.blooket.com/favicon.ico", title: "Play Blooket | Blooket" },
        { name: "Gmail", icon: "https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico", title: "Gmail" },
        { name: "YouTube", icon: "https://www.youtube.com/favicon.ico", title: "YouTube" },
        { name: "Powerschool", icon: "https://waverlyk12.powerschool.com/favicon.ico", title: "Grades and Attendance" }
    ],

    // Wisp servers
    wispServers: [
        { name: "Primary", url: "wss://dash.goip.de/wisp/" },
        { name: "Backup 1", url: "wss://register.goip.it/wisp/" },
        { name: "Backup 2", url: "wss://wisp.rhw.one/wisp/" }
    ]
};

