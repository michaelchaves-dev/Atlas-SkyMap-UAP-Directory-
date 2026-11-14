// ATLAS SkyMap — live layer client. Reads /api/live (public feeds, aggregated
// server-side) and paints the Live Watch panel + an ISS marker on the map.
// Facts only: values are shown with their source and fetch time.

(function () {
  const el = id => document.getElementById(id);
  let issMarker = null, issTrail = null, lastPos = null;

  function card(title, body, source) {
    return `<div class="live-card"><h4>${title}</h4><div class="live-body">${body}</div><p class="live-src">${source}</p></div>`;
  }

  function render(d) {
    const when = new Date(d.generated_at).toLocaleTimeString();
    let html = "";
    if (d.iss && !d.iss.error) {
      html += card("ISS — live position",
        `<b>${d.iss.latitude}, ${d.iss.longitude}</b><br>${d.iss.altitude_km} km up · ${d.iss.velocity_kmh.toLocaleString()} km/h · ${d.iss.visibility}`,
        `Source: ${d.iss.source} · ${when}`);
      if (window.L && window.__atlasMap) {
        const pos = [d.iss.latitude, d.iss.longitude];
        if (!issMarker) {
          issMarker = L.circleMarker(pos, { radius: 6, color: "#04121f", weight: 1.5, fillColor: "#5eead4", fillOpacity: 1 })
            .addTo(window.__atlasMap).bindPopup("<strong>ISS (live)</strong><br>Public tracking position");
          issTrail = L.polyline([], { color: "#5eead4", weight: 1, opacity: 0.6 }).addTo(window.__atlasMap);
        }
        issMarker.setLatLng(pos);
        if (lastPos && Math.abs(lastPos[1] - pos[1]) < 180) issTrail.addLatLng(pos);
        lastPos = pos;
      }
    }
    const sw = d.space_weather || {};
    if (sw.latest_alert || sw.kp_latest) {
      const kp = sw.kp_latest && sw.kp_latest.kp != null ? `Planetary K-index: <b>${sw.kp_latest.kp}</b><br>` : "";
      const wind = sw.solar_wind_km_s ? `Solar wind: <b>${sw.solar_wind_km_s} km/s</b><br>` : "";
      const alert = sw.latest_alert && sw.latest_alert.headline ? `<span class="live-alert">${sw.latest_alert.headline}</span>` : "No active alert headline.";
      html += card("Space weather — right now", kp + wind + alert, "Source: NOAA SWPC");
    }
    const faa = d.faa_nas_status || {};
    if (!faa.error) {
      const types = (faa.delay_types || []).join(", ") || "No national delay programs posted";
      html += card("US airspace — FAA NAS status",
        `<b>${faa.affected_count} airport(s)</b> in an active program<br>${types}`,
        `Source: FAA NAS Status · updated ${faa.update_time || "—"}`);
    }
    const mil = d.military_adsb_broadcasting || {};
    if (!mil.error) {
      html += card("Military aircraft — broadcasting now",
        `<b>${mil.aircraft_count}</b> aircraft openly broadcasting ADS-B.<br><span class="live-note">${mil.note}</span>`,
        "Source: adsb.lol open data");
    }
    if (d.earth_camera) {
      html += `<div class="live-card live-cam"><h4>${d.earth_camera.name}</h4>` +
        `<a href="${d.earth_camera.source_url}" target="_blank" rel="noopener"><img id="goesImg" src="${d.earth_camera.image_url}" alt="NOAA GOES-19 live full-disk view of Earth" loading="lazy"></a>` +
        `<p class="live-src">Source: ${d.earth_camera.source} · image refreshes with the panel</p></div>`;
    }
    el("liveGrid").innerHTML = html || `<p class="empty">Live feeds did not answer this time — the register below is unaffected.</p>`;
    el("liveStamp").textContent = `Updated ${when} · auto-refreshes every 2 minutes · ${d.note}`;
  }

  async function load() {
    try {
      const r = await fetch("/api/live");
      if (!r.ok) throw new Error("/api/live " + r.status);
      render(await r.json());
    } catch (e) {
      el("liveGrid").innerHTML = `<p class="empty">Live layer unavailable (${e.message}). On a local preview this is expected — the live feeds run on the deployed site.</p>`;
    }
  }
  load();
  setInterval(load, 120000);
})();
