const STORAGE_KEY = "protectedSites";

const els = {
  input: document.getElementById("domainInput"),
  addBtn: document.getElementById("addBtn"),
  list: document.getElementById("siteList"),
  emptyHint: document.getElementById("emptyHint"),
  logoutAll: document.getElementById("logoutAllBtn"),
  status: document.getElementById("status"),
};

// What we wipe. Origin-scoped so only the listed sites are touched.
const DATA_TYPES = {
  cookies: true,
  localStorage: true,
  indexedDB: true,
  cacheStorage: true,
  serviceWorkers: true,
  fileSystems: true,
  webSQL: true,
};

// Normalize "https://ChatGPT.com/foo" or "chatgpt.com" -> "chatgpt.com"
function normalizeDomain(raw) {
  let d = raw.trim().toLowerCase();
  if (!d) return null;
  d = d.replace(/^https?:\/\//, "").replace(/^www\./, "");
  d = d.split("/")[0].split("?")[0].split("#")[0];
  if (!d.includes(".") || d.includes(" ")) return null;
  return d;
}

// browsingData filters by exact origin, so cover the common variants.
function originsFor(domain) {
  return [
    `https://${domain}`,
    `https://www.${domain}`,
    `http://${domain}`,
    `http://www.${domain}`,
  ];
}

async function getSites() {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  return data[STORAGE_KEY] || [];
}

async function setSites(sites) {
  await chrome.storage.local.set({ [STORAGE_KEY]: sites });
}

function setStatus(msg, isError = false) {
  els.status.textContent = msg;
  els.status.style.color = isError ? "#c0392b" : "#1e7e34";
}

function formatTime(ts) {
  if (!ts) return "never logged out";
  return "last logout: " + new Date(ts).toLocaleString();
}

async function render() {
  const sites = await getSites();
  els.list.innerHTML = "";
  els.emptyHint.style.display = sites.length ? "none" : "block";
  els.logoutAll.disabled = sites.length === 0;

  for (const site of sites) {
    const li = document.createElement("li");

    const info = document.createElement("div");
    const name = document.createElement("span");
    name.className = "domain";
    name.textContent = site.domain;
    const meta = document.createElement("span");
    meta.className = "meta";
    meta.textContent = formatTime(site.lastLogout);
    info.appendChild(name);
    info.appendChild(meta);

    const rowActions = document.createElement("div");
    rowActions.className = "row-actions";

    const outBtn = document.createElement("button");
    outBtn.className = "link-btn";
    outBtn.textContent = "Log out";
    outBtn.onclick = () => logoutDomains([site.domain]);

    const delBtn = document.createElement("button");
    delBtn.className = "link-btn danger";
    delBtn.textContent = "Remove";
    delBtn.onclick = () => removeSite(site.domain);

    rowActions.appendChild(outBtn);
    rowActions.appendChild(delBtn);

    li.appendChild(info);
    li.appendChild(rowActions);
    els.list.appendChild(li);
  }
}

async function addSite() {
  const domain = normalizeDomain(els.input.value);
  if (!domain) {
    setStatus("Enter a valid domain like chatgpt.com", true);
    return;
  }
  const sites = await getSites();
  if (sites.some((s) => s.domain === domain)) {
    setStatus(`${domain} is already in the list`, true);
    return;
  }
  sites.push({ domain, lastLogout: null });
  await setSites(sites);
  els.input.value = "";
  setStatus(`Added ${domain}`);
  render();
}

async function removeSite(domain) {
  const sites = (await getSites()).filter((s) => s.domain !== domain);
  await setSites(sites);
  setStatus(`Removed ${domain}`);
  render();
}

async function logoutDomains(domains) {
  if (!domains.length) return;
  if (!confirm(`Log out of:\n\n${domains.join("\n")}\n\nThis clears cookies & storage for these sites.`)) {
    return;
  }

  const origins = domains.flatMap(originsFor);
  try {
    await chrome.browsingData.remove({ origins }, DATA_TYPES);

    const now = Date.now();
    const sites = await getSites();
    for (const s of sites) {
      if (domains.includes(s.domain)) s.lastLogout = now;
    }
    await setSites(sites);
    setStatus(`Logged out of ${domains.length} site(s). Reload the tab(s) to confirm.`);
    render();
  } catch (e) {
    setStatus("Error: " + e.message, true);
  }
}

els.addBtn.onclick = addSite;
els.input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addSite();
});
els.logoutAll.onclick = async () => {
  const sites = await getSites();
  logoutDomains(sites.map((s) => s.domain));
};

render();
