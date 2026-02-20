(function () {
    'use strict';

    const rotateTheme = (settings) => {
        const presets = window.SITE_CONFIG?.themePresets || {};
        const keys = Object.keys(presets);
        if (keys.length > 0) {
            let randomKey;
            const lastRotation = settings.lastThemeRotation || 0;
            if (lastRotation === 0) {
                const allowed = ['dark', 'midnight'].filter(k => keys.includes(k));
                randomKey = allowed.length > 0 ? allowed[Math.floor(Math.random() * allowed.length)] : keys[0];
            } else if (keys.length > 1) {
                let attempts = 0;
                do {
                    randomKey = keys[Math.floor(Math.random() * keys.length)];
                    attempts++;
                } while (presets[randomKey].surface === settings.surfaceColor && attempts < 5);
            } else {
                randomKey = keys[0];
            }

            if (randomKey) {
                const theme = presets[randomKey];
                window.Settings.update({
                    background: theme.bg,
                    surfaceColor: theme.surface,
                    surfaceHoverColor: theme.surfaceHover,
                    surfaceActiveColor: theme.surfaceActive,
                    secondaryColor: theme.secondary,
                    borderColor: theme.border,
                    borderLightColor: theme.borderLight,
                    textColor: theme.text,
                    textSecondaryColor: theme.textSec,
                    textDimColor: theme.textDim,
                    accentColor: theme.accent,
                    lastThemeRotation: Date.now()
                });
            }
        }
    };

    const rotateBackground = (settings) => {
        const presets = (window.SITE_CONFIG?.backgroundPresets || []).filter(p => p.id !== 'custom');
        if (presets.length > 0) {
            let randomPreset;
            if (presets.length > 1) {
                let attempts = 0;
                const currentId = settings.customBackground?.id;
                do {
                    randomPreset = presets[Math.floor(Math.random() * presets.length)];
                    attempts++;
                } while (randomPreset.id === currentId && attempts < 5);
            } else {
                randomPreset = presets[0];
            }
            if (randomPreset) {
                window.Settings.update({
                    customBackground: randomPreset,
                    lastBackgroundRotation: Date.now()
                });
            }
        }
    };

    window.RotationManager = {
        rotateTheme: () => rotateTheme(window.Settings.getAll()),
        rotateBackground: () => rotateBackground(window.Settings.getAll())
    };

    const checkRotation = () => {
        if (!window.Settings) return;
        const settings = window.Settings.getAll();
        const now = Date.now();
        const TWO_DAYS = 172800000;

        if (settings.themeRotation) {
            const lastRotation = settings.lastThemeRotation || 0;
            if (now - lastRotation >= TWO_DAYS) {
                rotateTheme(settings);
            }
        }

        if (settings.backgroundRotation) {
            const lastRotation = settings.lastBackgroundRotation || 0;
            if (now - lastRotation >= TWO_DAYS) {
                rotateBackground(settings);
            }
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkRotation);
    } else {
        checkRotation();
    }
})();
