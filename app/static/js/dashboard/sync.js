export function bindDatabaseSync(app) {
    window.addEventListener('focus', () => {
        app.syncFromDatabase();
    });

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            app.syncFromDatabase();
        }
    });
    // Periodically sync every 60 seconds
    setInterval(() => {
        if (document.visibilityState === 'visible') {
            app.syncFromDatabase();
        }
    }, 60000);
}
