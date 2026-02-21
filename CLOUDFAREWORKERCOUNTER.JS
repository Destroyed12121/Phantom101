export default {
    async fetch(request, env) {
        // Handle CORS preflight
        if (request.method === "OPTIONS") {
            return new Response(null, {
                status: 204,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type",
                    "Access-Control-Max-Age": "86400"
                }
            });
        }

        const url = "https://valid-duckling-55158.upstash.io";
        // IMPORTANT: Replace the token below with your Upstash Redis "Standard" (Read-Write) token.
        // The current token is READ-ONLY and will cause 500 errors when trying to register users.
        const token = "Add2AAIncDJkOTM5NTIyNGIwY2Y0OGNkYWU1OTczNzBiNjM2ZGU5ZHAyNTUxNTg";
        const headers = { Authorization: `Bearer ${token}` };

        // Configuration constants
        const CYCLE_DURATION = 30; // seconds between refreshes
        const TTL_BUFFER = 5; // extra seconds for safety

        try {
            // Identify the user by their session ID sent from the frontend.
            // Fall back to IP so the worker still works even if called directly.
            const urlObj = new URL(request.url);
            const sessionId = urlObj.searchParams.get("id")
                || request.headers.get("CF-Connecting-IP")
                || "anonymous";
            const action = urlObj.searchParams.get("action");

            const key = `online:${sessionId}`;
            const cycleKey = "online:refresh_cycle";
            const countCacheKey = "online:count_cache";
            const locationsCacheKey = "online:locations_cache";

            if (action === "leave") {
                await fetch(`${url}/del/${key}`, { headers });
                return new Response(JSON.stringify({ success: true }), {
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*"
                    }
                });
            }

            // ========== GLOBAL SYNCHRONIZED CYCLE ==========
            // All users sync to the SAME cycle end time
            // No matter when you join, you get the same nextRefresh
            
            const now = Math.floor(Date.now() / 1000);
            let currentCycleEnd = 0;
            let timeRemaining = CYCLE_DURATION;
            let shouldRecalculate = false;

            // Get cycle timestamp
            const getCycleRes = await fetch(`${url}/get/${cycleKey}`, { headers });
            
            if (getCycleRes.ok) {
                const getCycleJson = await getCycleRes.json();
                const storedCycle = getCycleJson.result;
                
                if (storedCycle) {
                    currentCycleEnd = parseInt(storedCycle, 10);
                    timeRemaining = currentCycleEnd - now;
                    
                    // If cycle expired, create new one
                    if (timeRemaining <= 0) {
                        shouldRecalculate = true;
                        currentCycleEnd = now + CYCLE_DURATION;
                        timeRemaining = CYCLE_DURATION;
                        
                        // Set new cycle
                        await fetch(`${url}/set/${cycleKey}/${currentCycleEnd}/EX/${CYCLE_DURATION + TTL_BUFFER}`, { headers });
                    }
                } else {
                    // No cycle, create one
                    shouldRecalculate = true;
                    currentCycleEnd = now + CYCLE_DURATION;
                    timeRemaining = CYCLE_DURATION;
                    
                    await fetch(`${url}/set/${cycleKey}/${currentCycleEnd}/EX/${CYCLE_DURATION + TTL_BUFFER}`, { headers });
                }
            } else {
                // Error, create new cycle
                shouldRecalculate = true;
                currentCycleEnd = now + CYCLE_DURATION;
                timeRemaining = CYCLE_DURATION;
                
                await fetch(`${url}/set/${cycleKey}/${currentCycleEnd}/EX/${CYCLE_DURATION + TTL_BUFFER}`, { headers });
            }

            // Clamp timeRemaining to valid range
            timeRemaining = Math.max(1, Math.min(timeRemaining, CYCLE_DURATION));

            // User TTL syncs to cycle end (all users expire together)
            const userTtl = timeRemaining + TTL_BUFFER;

            // Capture location data from Cloudflare's request.cf object
            const cf = request.cf || {};
            const city = cf.city || "Unknown City";
            const region = cf.region || cf.country || "Unknown Region";
            const location = `${city}, ${region}`;

            // Set/update user key
            const setRes = await fetch(`${url}/set/${key}/${encodeURIComponent(location)}/EX/${userTtl}`, { headers });
            if (!setRes.ok) {
                throw new Error(`Redis SET failed: ${setRes.status}`);
            }

            // ========== COUNT CACHING ==========
            // Only recalculate when cycle expires
            let count = 1;
            let locationCounts = {};
            let isFreshCalculation = false;

            if (shouldRecalculate) {
                // Do SCAN to get fresh count
                isFreshCalculation = true;
                
                let cursor = "0";
                let allKeys = [];
                do {
                    const scanRes = await fetch(`${url}/scan/${cursor}/MATCH/online:*/COUNT/100`, { headers });
                    if (!scanRes.ok) {
                        throw new Error(`Redis SCAN failed: ${scanRes.status}`);
                    }
                    const scanData = await scanRes.json();
                    cursor = scanData.result[0];
                    const keys = scanData.result[1];
                    if (keys && keys.length > 0) {
                        // Filter out cache keys
                        const userKeys = keys.filter(k => k !== cycleKey && k !== countCacheKey && k !== locationsCacheKey);
                        allKeys = allKeys.concat(userKeys);
                    }
                } while (cursor !== "0");

                count = allKeys.length || 1;

                // Cache the count
                await fetch(`${url}/set/${countCacheKey}/${count}/EX/${CYCLE_DURATION + TTL_BUFFER}`, { headers });

                // Get locations for cache
                if (allKeys.length > 0) {
                    const mgetRes = await fetch(`${url}/mget/${allKeys.join("/")}`, { headers });
                    if (mgetRes.ok) {
                        const mgetData = await mgetRes.json();
                        const locs = mgetData.result.filter(l => l).map(l => decodeURIComponent(l));
                        for (const loc of locs) {
                            locationCounts[loc] = (locationCounts[loc] || 0) + 1;
                        }
                    }
                }

                // Cache locations
                await fetch(`${url}/set/${locationsCacheKey}/${encodeURIComponent(JSON.stringify(locationCounts))}/EX/${CYCLE_DURATION + TTL_BUFFER}`, { headers });

            } else {
                // Use cached count
                const getCacheRes = await fetch(`${url}/get/${countCacheKey}`, { headers });
                if (getCacheRes.ok) {
                    const cacheJson = await getCacheRes.json();
                    if (cacheJson.result) {
                        count = parseInt(cacheJson.result, 10);
                    }
                }

                // Get cached locations
                const getLocsRes = await fetch(`${url}/get/${locationsCacheKey}`, { headers });
                if (getLocsRes.ok) {
                    const locsJson = await getLocsRes.json();
                    if (locsJson.result) {
                        try {
                            locationCounts = JSON.parse(decodeURIComponent(locsJson.result));
                        } catch (e) { }
                    }
                }
            }

            // Handle API request
            const isApi = new URL(request.url).searchParams.has("id") || request.headers.get("Accept")?.includes("application/json");

            if (isApi) {
                return new Response(JSON.stringify({ 
                    online: count, 
                    // Same for ALL users - synchronized!
                    nextRefresh: timeRemaining,
                    cycleEnd: currentCycleEnd,
                    isFresh: isFreshCalculation
                }), {
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*"
                    }
                });
            }

            // Build HTML for direct visits
            let locationsHtml = '';
            const uniqueLocs = Object.keys(locationCounts);
            if (uniqueLocs.length > 0) {
                locationsHtml = uniqueLocs.map(loc => {
                    const cnt = locationCounts[loc];
                    return `<li>${loc}${cnt > 1 ? ` x${cnt}` : ''}</li>`;
                }).join('');
            } else {
                locationsHtml = '<li>None detected</li>';
            }

            const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Phantom Online</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <meta http-equiv="refresh" content="${timeRemaining}">
          <style>
            body { font-family: monospace; background: #000; color: #fff; padding: 20px; line-height: 1.5; }
            ul { list-style-type: "- "; padding-left: 20px; }
            .count { font-size: 24px; font-weight: bold; color: #0f0; }
          </style>
        </head>
        <body>
          <div class="count">
            ${count} Online <span style="font-size: 14px; color: #888; font-weight: normal; margin-left: 8px;">(Refreshing in ${timeRemaining}s)</span>
          </div>
          <p>Locations:</p>
          <ul>
            ${locationsHtml}
          </ul>
        </body>
        </html>
      `;

            return new Response(html, {
                headers: { "Content-Type": "text/html; charset=utf-8" }
            });

        } catch (err) {
            return new Response(JSON.stringify({ error: err.message }), {
                status: 500,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*"
                }
            });
        }
    }
}
