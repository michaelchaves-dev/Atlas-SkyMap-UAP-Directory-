// ATLAS SkyMap — live public-feed aggregator (Vercel serverless function)
// Facts only: every value below comes from a named public source at fetch time.
// Sources (all public, no keys, legal for linking/reading):
//   ISS position      https://api.wheretheiss.at/v1/satellites/25544
//   ISS TLE           https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=TLE
//   Space weather     https://services.swpc.noaa.gov (NOAA SWPC alerts, Kp index, solar wind)
//   US airspace       https://nasstatus.faa.gov/api/airport-status-information (FAA NAS Status XML)
//   Military ADS-B    https://api.adsb.lol/v2/mil (community open-data ADS-B, broadcast signals only)
//   Earth camera      NOAA GOES-19 full-disk GeoColor (link only, served by NOAA CDN)
// Cached at the edge so upstream public services are not hammered.

const UA = { "user-agent": "ATLAS-SkyMap/1.1 (+https://atlas-skymap.vercel.app)" };

async function getText(url, timeoutMs = 9000) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { headers: UA, signal: ctl.signal });
    if (!r.ok) throw new Error(url + " -> " + r.status);
    return await r.text();
  } finally { clearTimeout(t); }
}
async function getJson(url, timeoutMs = 9000) {
  return JSON.parse(await getText(url, timeoutMs));
}
const settle = p => p.then(v => ({ ok: true, v })).catch(e => ({ ok: false, error: String(e.message || e) }));

function parseFaa(xml) {
  const update = (xml.match(/<Update_Time>([^<]+)<\/Update_Time>/) || [])[1] || null;
  const names = [...xml.matchAll(/<Name>([^<]+)<\/Name>/g)].map(m => m[1]);
  const airports = [...xml.matchAll(/<ARPT>([A-Z]{3,4})<\/ARPT>/g)].map(m => m[1]);
  return {
    update_time: update,
    delay_types: [...new Set(names)],
    affected_airports: [...new Set(airports)].slice(0, 40),
    affected_count: new Set(airports).size,
    source_url: "https://nasstatus.faa.gov/"
  };
}

export default async function handler(req, res) {
  const [iss, tle, alerts, kp, wind, faa, mil] = await Promise.all([
    settle(getJson("https://api.wheretheiss.at/v1/satellites/25544")),
    settle(getText("https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=TLE")),
    settle(getJson("https://services.swpc.noaa.gov/products/alerts.json")),
    settle(getJson("https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json")),
    settle(getJson("https://services.swpc.noaa.gov/products/summary/solar-wind-speed.json")),
    settle(getText("https://nasstatus.faa.gov/api/airport-status-information")),
    settle(getJson("https://api.adsb.lol/v2/mil"))
  ]);

  const out = {
    generated_at: new Date().toISOString(),
    note: "Live public data only. A match in time and place is a check, not a conclusion.",
    iss: iss.ok ? {
      latitude: +iss.v.latitude.toFixed(3), longitude: +iss.v.longitude.toFixed(3),
      altitude_km: +iss.v.altitude.toFixed(1), velocity_kmh: Math.round(iss.v.velocity),
      visibility: iss.v.visibility, source: "wheretheiss.at (NORAD 25544)"
    } : { error: iss.error },
    iss_tle: tle.ok ? { lines: tle.v.trim().split(/\r?\n/).slice(0, 3), source: "CelesTrak" } : { error: tle.error },
    space_weather: {
      latest_alert: alerts.ok && alerts.v.length ? {
        issued: alerts.v[0].issue_datetime,
        headline: (alerts.v[0].message.split(/\r?\n/)
          .map(l => l.trim())
          .find(l => l.length > 12 && !/^(Space Weather Message Code|Serial Number|Issue Time)/.test(l)) || "").slice(0, 180)
      } : { error: alerts.ok ? "no alerts" : alerts.error },
      kp_latest: kp.ok && kp.v.length > 1 ? (() => {
        const last = kp.v[kp.v.length - 1];
        return Array.isArray(last) ? { time: last[0], kp: last[1] } : { time: last.time_tag, kp: last.Kp };
      })() : { error: "unavailable" },
      solar_wind_km_s: wind.ok && wind.v.length ? wind.v[wind.v.length - 1].proton_speed : null,
      source: "NOAA SWPC"
    },
    faa_nas_status: faa.ok ? parseFaa(faa.v) : { error: faa.error },
    military_adsb_broadcasting: mil.ok && Array.isArray(mil.v.ac) ? {
      aircraft_count: mil.v.ac.length,
      note: "Aircraft openly broadcasting ADS-B right now (adsb.lol open data). Aircraft not broadcasting do not appear — absence here proves nothing.",
      source: "adsb.lol"
    } : { error: mil.ok ? "unexpected format" : mil.error },
    earth_camera: {
      name: "NOAA GOES-19 — full-disk GeoColor (live satellite camera)",
      image_url: "https://cdn.star.nesdis.noaa.gov/GOES19/ABI/FD/GEOCOLOR/latest.jpg",
      source_url: "https://www.star.nesdis.noaa.gov/GOES/fulldisk_band.php?sat=G19",
      source: "NOAA NESDIS"
    },
    watch_links: [
      { name: "NASA Live", url: "https://www.nasa.gov/live/", what: "NASA TV, ISS views and launch coverage (official stream — linked, not re-hosted)" },
      { name: "SpaceX Launches", url: "https://www.spacex.com/launches/", what: "Official mission pages and webcasts, incl. Starship flights" },
      { name: "FAA ATCSCC Advisories", url: "https://www.fly.faa.gov/adv/adv_list.jsp", what: "Ground stops, ground delays and airspace advisories as issued" },
      { name: "CelesTrak Visual SAT Catalog", url: "https://celestrak.org/satcat/search.php", what: "Every tracked satellite — check what was overhead, by time and place" },
      { name: "AMS Fireball Reports", url: "https://fireball.amsmeteors.org/", what: "American Meteor Society witness fireball reports and events" },
      { name: "Global Meteor Network", url: "https://globalmeteornetwork.org/", what: "Open meteor-camera network — nightly detections worldwide" },
      { name: "USGS / NOAA Space Weather", url: "https://www.swpc.noaa.gov/", what: "Solar and geomagnetic conditions" },
      { name: "Windy Webcams", url: "https://www.windy.com/webcams", what: "Public webcams worldwide — linked directory, streams stay with their owners" }
    ]
  };

  res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=300");
  res.setHeader("Content-Type", "application/json");
  res.status(200).json(out);
}
