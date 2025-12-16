// ============================================
// SITE CONFIGURATION - PHANTOM UNBLOCKED
// ============================================

window.SITE_CONFIG = {
    name: "Phantom",
    fullName: "Phantom Unblocked",
    version: "1.0.3",

    // Changelog
    changelog: [
        "most things are fixxed now, MOVIES FIXXED",
        "added first visit white screen + aboutblank auto cloaking",
        "JOIN THE DISCORD"
    ],

    // Discord
    discord: {
        inviteUrl: "https://discord.gg/tHWx9NXp5p",
        widgetServer: "1447673724017971324",
        widgetChannel: "1447673726228496617",
    },
    firstVisitCloak: true,

    // Default settings
    defaults: {
        cloakMode: "about:blank",
        tabTitle: "New tab",
        tabFavicon: "https://www.google.com/chrome/static/images/chrome-logo-m100.svg",
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

        // Theme colors
        accentColor: "#ffffff",
        surfaceColor: "#0f0f0f",
        surfaceHoverColor: "#1a1a1a",
        surfaceActiveColor: "#252525",
        secondaryColor: "#2e2e33",
        borderColor: "#1f1f1f",
        borderLightColor: "#2a2a2a",
        textColor: "#e4e4e7",
        textSecondaryColor: "#71717a",
        textDimColor: "#52525b",
        background: { type: "color", value: "#0a0a0a" }
    },

    // Tab Cloaks
    cloakPresets: [
        { name: "Google", icon: "https://www.google.com/chrome/static/images/chrome-logo-m100.svg", title: "New Tab" },
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

