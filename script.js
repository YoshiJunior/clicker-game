const STORAGE_KEY = "biscuit-bazaar-save-v5";
const SECRET_PASSWORD = "yoshisisgreat";
const SECRET_CPS_BONUS = 1_000_000_000_000;

const buildingDefs = [
  {
    id: "cursor",
    name: "Handy Helper",
    description: "A tiny assistant that keeps the oven moving.",
    baseCost: 10,
    growth: 1.15,
    cps: 0.1,
    requirements: {},
  },
  {
    id: "grandma",
    name: "Grandma",
    description: "The original remington legend. Still unstoppable.",
    baseCost: 50,
    growth: 1.18,
    cps: 0.5,
    requirements: { totalCookies: 25 },
  },
  {
    id: "oven",
    name: "Stone Oven",
    description: "An industrial oven with suspiciously good throughput.",
    baseCost: 220,
    growth: 1.2,
    cps: 2,
    requirements: { totalCookies: 120 },
  },
  {
    id: "factory",
    name: "Factory Line",
    description: "Conveyors, timers, and enough heat to worry the inspectors.",
    baseCost: 900,
    growth: 1.22,
    cps: 8,
    requirements: { totalCookies: 700 },
  },
  {
    id: "temple",
    name: "Temple of Remington",
    description: "A monument to automation.",
    baseCost: 4000,
    growth: 1.25,
    cps: 32,
    requirements: { totalCookies: 3500 },
  },
  {
    id: "moon",
    name: "Moon Oven",
    description: "One small step for Remingtons, one giant leap for the bakery.",
    baseCost: 18000,
    growth: 1.28,
    cps: 120,
    requirements: { totalCookies: 14000 },
  },
  {
    id: "galaxy",
    name: "Galaxy Mill",
    description: "A cosmic grinder that turns starlight into Remingtons.",
    baseCost: 75000,
    growth: 1.3,
    cps: 480,
    requirements: { totalCookies: 60000 },
  },
];

const upgradeDefs = [
  {
    id: "butter-fingers",
    name: "Butter Fingers",
    description: "+1 remington per click.",
    cost: 100,
    requirements: { totalCookies: 25 },
    effect: { clickAdd: 1 },
  },
  {
    id: "shiny-spatula",
    name: "Shiny Spatula",
    description: "Clicks are 2x stronger.",
    cost: 500,
    requirements: { buildingId: "cursor", count: 10 },
    effect: { clickMultiplier: 2 },
  },
  {
    id: "warm-hands",
    name: "Warm Hands",
    description: "+2 remingtons per click.",
    cost: 220,
    requirements: { totalCookies: 75 },
    effect: { clickAdd: 2 },
  },
  {
    id: "grandma-recipe",
    name: "Grandma's Secret Recipe",
    description: "Grandmas produce 50% more remingtons.",
    cost: 1500,
    requirements: { buildingId: "grandma", count: 10 },
    effect: { buildingMultipliers: { grandma: 1.5 } },
  },
  {
    id: "extra-mixing-bowl",
    name: "Extra Mixing Bowl",
    description: "All click bonuses are 2x stronger.",
    cost: 900,
    requirements: { buildingId: "cursor", count: 25 },
    effect: { clickMultiplier: 2 },
  },
  {
    id: "heat-shielding",
    name: "Heat Shielding",
    description: "Ovens produce 50% more remingtons.",
    cost: 3200,
    requirements: { buildingId: "oven", count: 5 },
    effect: { buildingMultipliers: { oven: 1.5 } },
  },
  {
    id: "assembly-optimizer",
    name: "Assembly Optimizer",
    description: "Factory lines produce 50% more remingtons.",
    cost: 9000,
    requirements: { buildingId: "factory", count: 3 },
    effect: { buildingMultipliers: { factory: 1.5 } },
  },
  {
    id: "conveyor-grease",
    name: "Conveyor Grease",
    description: "All buildings produce 20% more remingtons.",
    cost: 2500,
    requirements: { totalCookies: 1200 },
    effect: { globalCpsMultiplier: 1.2 },
  },
  {
    id: "sugar-cloud",
    name: "Sugar Cloud",
    description: "All buildings produce 25% more remingtons.",
    cost: 35000,
    requirements: { totalCookies: 15000 },
    effect: { globalCpsMultiplier: 1.25 },
  },
  {
    id: "moon-polish",
    name: "Moon Polish",
    description: "Moon ovens produce 2x remingtons.",
    cost: 90000,
    requirements: { buildingId: "moon", count: 4 },
    effect: { buildingMultipliers: { moon: 2 } },
  },
  {
    id: "cosmic-bell",
    name: "Cosmic Bell",
    description: "Clicks are 3x stronger and everything bakes faster.",
    cost: 250000,
    requirements: { buildingId: "galaxy", count: 2 },
    effect: { clickMultiplier: 3, globalCpsMultiplier: 1.5 },
  },
];

const state = {
  cookies: 0,
  totalCookies: 0,
  cookiesPerClick: 1,
  cookiesPerSecond: 0,
  activeTab: "shop",
  productionRemainder: 0,
  displayCookies: 0,
  secretUnlocked: false,
  secretCpsBonus: 0,
  buildings: Object.fromEntries(buildingDefs.map((building) => [building.id, 0])),
  upgrades: Object.fromEntries(upgradeDefs.map((upgrade) => [upgrade.id, false])),
  lastSavedAt: Date.now(),
};

const elements = {
  remingtons: document.getElementById("remingtons"),
  perClick: document.getElementById("perClick"),
  perSecond: document.getElementById("perSecond"),
  cookieButton: document.getElementById("cookieButton"),
  catalogList: document.getElementById("catalogList"),
  catalogScroll: document.getElementById("catalogScroll"),
  panelTitle: document.getElementById("panelTitle"),
  panelSubtitle: document.getElementById("panelSubtitle"),
  shopTab: document.getElementById("shopTab"),
  upgradeTab: document.getElementById("upgradeTab"),
  saveStatus: document.getElementById("saveStatus"),
  offlineBonus: document.getElementById("offlineBonus"),
  saveButton: document.getElementById("saveButton"),
  resetButton: document.getElementById("resetButton"),
  secretButton: document.getElementById("secretButton"),
};

let audioContext = null;

function formatNumber(value) {
  const number = Math.floor(Number(value) || 0);
  if (number < 1000) {
    return String(number);
  }
  if (number < 1_000_000) {
    return `${(number / 1000).toFixed(number < 10_000 ? 1 : 0)}k`;
  }
  if (number < 1_000_000_000) {
    return `${(number / 1_000_000).toFixed(number < 10_000_000 ? 1 : 0)}m`;
  }
  return `${(number / 1_000_000_000).toFixed(1)}b`;
}

function formatRate(value) {
  const number = Number(value) || 0;
  if (number < 1000) {
    return number.toFixed(1).replace(/\.0$/, "");
  }
  if (number < 1_000_000) {
    return `${(number / 1000).toFixed(number < 10_000 ? 1 : 0)}k`;
  }
  if (number < 1_000_000_000) {
    return `${(number / 1_000_000).toFixed(number < 10_000_000 ? 1 : 0)}m`;
  }
  return `${(number / 1_000_000_000).toFixed(1)}b`;
}

function buildingCost(definition, count) {
  return Math.floor(definition.baseCost * definition.growth ** count);
}

function meetsRequirements(requirements = {}) {
  if (requirements.totalCookies && state.totalCookies < requirements.totalCookies) {
    return false;
  }

  if (requirements.buildingId && state.buildings[requirements.buildingId] < requirements.count) {
    return false;
  }

  if (requirements.upgradeId && !state.upgrades[requirements.upgradeId]) {
    return false;
  }

  return true;
}

function getBuildingMultiplier(id) {
  let multiplier = 1;

  upgradeDefs.forEach((upgrade) => {
    if (!state.upgrades[upgrade.id]) {
      return;
    }

    const buildingMultiplier = upgrade.effect.buildingMultipliers?.[id];
    if (buildingMultiplier) {
      multiplier *= buildingMultiplier;
    }
  });

  return multiplier;
}

function getGlobalCpsMultiplier() {
  return upgradeDefs.reduce((multiplier, upgrade) => {
    if (!state.upgrades[upgrade.id]) {
      return multiplier;
    }

    return multiplier * (upgrade.effect.globalCpsMultiplier ?? 1);
  }, 1);
}

function getClickBonus() {
  let additive = 0;
  let multiplier = 1;

  upgradeDefs.forEach((upgrade) => {
    if (!state.upgrades[upgrade.id]) {
      return;
    }

    additive += upgrade.effect.clickAdd ?? 0;
    multiplier *= upgrade.effect.clickMultiplier ?? 1;
  });

  return (1 + additive) * multiplier;
}

function totalCps() {
  const base = buildingDefs.reduce((sum, def) => {
    const owned = state.buildings[def.id];
    const multiplier = getBuildingMultiplier(def.id);
    return sum + owned * def.cps * multiplier;
  }, 0);

  return base * getGlobalCpsMultiplier() + state.secretCpsBonus;
}

function updateDerivedStats() {
  state.cookiesPerClick = getClickBonus();
  state.cookiesPerSecond = totalCps();
}

function getVisibleBuildings() {
  return buildingDefs.filter((definition) => meetsRequirements(definition.requirements));
}

function getVisibleUpgrades() {
  return upgradeDefs.filter((definition) => meetsRequirements(definition.requirements));
}

function setActiveTab(tab) {
  state.activeTab = tab;
  updateTabButtons();
  updateCatalogHeader();
  renderCatalog({ resetScroll: true });
}

function updateTabButtons() {
  const isShop = state.activeTab === "shop";
  elements.shopTab.classList.toggle("active", isShop);
  elements.upgradeTab.classList.toggle("active", !isShop);
  elements.shopTab.setAttribute("aria-selected", String(isShop));
  elements.upgradeTab.setAttribute("aria-selected", String(!isShop));
}

function updateCatalogHeader() {
  if (state.activeTab === "shop") {
    elements.panelTitle.textContent = "Shop";
    elements.panelSubtitle.textContent = "Buy producers to automate your bakery.";
    return;
  }

  elements.panelTitle.textContent = "Upgrades";
  elements.panelSubtitle.textContent = "Permanent boosts for your bakery machine.";
}

function upgradeState(definition) {
  const purchased = Boolean(state.upgrades[definition.id]);
  const unlocked = meetsRequirements(definition.requirements);
  const canBuy = unlocked && !purchased && state.cookies >= definition.cost;

  return { purchased, unlocked, canBuy };
}

function updateDisplayedCookies(delta) {
  const target = state.cookies;
  const smoothing = Math.min(1, delta * 8);
  state.displayCookies += (target - state.displayCookies) * smoothing;

  if (Math.abs(target - state.displayCookies) < 0.01) {
    state.displayCookies = target;
  }
}

function renderStats() {
  elements.remingtons.textContent = formatNumber(state.displayCookies);
  elements.perClick.textContent = formatNumber(state.cookiesPerClick);
  elements.perSecond.textContent = formatRate(state.cookiesPerSecond);
}

function updateUI() {
  updateDerivedStats();
  renderStats();
  updateTabButtons();
  updateCatalogHeader();
  renderCatalog();
}

function renderBuildingCard(definition) {
  const owned = state.buildings[definition.id];
  const cost = buildingCost(definition, owned);
  const canBuy = state.cookies >= cost;

  const item = document.createElement("article");
  item.className = "shop-item";
  item.innerHTML = `
    <div class="shop-top">
      <div>
        <h3>${definition.name}</h3>
        <p>${definition.description}</p>
      </div>
      <div class="shop-meta">
        <div>${owned} owned</div>
        <div>${formatRate(definition.cps)} / sec each</div>
      </div>
    </div>
    <button class="shop-buy" type="button" ${canBuy ? "" : "disabled"}>
      Buy for ${formatNumber(cost)} remingtons
    </button>
  `;

  item.querySelector("button").addEventListener("click", (event) => {
    buyBuilding(definition.id, event);
  });

  return item;
}

function renderUpgradeCard(definition) {
  const { purchased, canBuy } = upgradeState(definition);
  const item = document.createElement("article");
  item.className = "shop-item";

  item.innerHTML = `
    <div class="shop-top">
      <div>
        <h3>${definition.name}</h3>
        <p>${definition.description}</p>
      </div>
      <div class="shop-meta">
        <div>${purchased ? "Purchased" : "Unlocked"}</div>
        <div>${formatNumber(definition.cost)} remingtons</div>
      </div>
    </div>
    <button class="shop-buy alt" type="button" ${canBuy ? "" : "disabled"}>
      ${purchased ? "Owned" : `Buy for ${formatNumber(definition.cost)} remingtons`}
    </button>
  `;

  item.querySelector("button").addEventListener("click", () => buyUpgrade(definition.id));

  return item;
}

function renderEmptyState(message) {
  const item = document.createElement("article");
  item.className = "shop-item empty-state";
  item.innerHTML = `
    <div class="shop-top">
      <div>
        <h3>Nothing unlocked yet</h3>
        <p>${message}</p>
      </div>
    </div>
  `;
  return item;
}

function renderCatalog(options = {}) {
  const { resetScroll = false } = options;
  const previousScrollTop = resetScroll ? 0 : elements.catalogScroll.scrollTop;
  elements.catalogList.innerHTML = "";

  if (state.activeTab === "shop") {
    const visibleBuildings = getVisibleBuildings();
    if (visibleBuildings.length === 0) {
      elements.catalogList.appendChild(renderEmptyState("Bake a little more to unlock your first producer."));
      elements.catalogScroll.scrollTop = previousScrollTop;
      return;
    }

    visibleBuildings.forEach((definition) => {
      elements.catalogList.appendChild(renderBuildingCard(definition));
    });
    elements.catalogScroll.scrollTop = previousScrollTop;
    return;
  }

  const visibleUpgrades = getVisibleUpgrades();
  if (visibleUpgrades.length === 0) {
    elements.catalogList.appendChild(renderEmptyState("No upgrades are unlocked yet. Keep baking to reveal them."));
    elements.catalogScroll.scrollTop = previousScrollTop;
    return;
  }

  visibleUpgrades.forEach((definition) => {
    elements.catalogList.appendChild(renderUpgradeCard(definition));
  });
  elements.catalogScroll.scrollTop = previousScrollTop;
}

function floatText(text, x, y) {
  const node = document.createElement("div");
  node.className = "floaty";
  node.textContent = text;
  node.style.left = `${x}px`;
  node.style.top = `${y}px`;
  document.body.appendChild(node);
  window.setTimeout(() => node.remove(), 900);
}

function spawnParticles(x, y, color = "#f4b860", count = 12) {
  for (let index = 0; index < count; index += 1) {
    const node = document.createElement("div");
    node.className = "particle";
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
    node.style.background = color;
    node.style.color = color;

    const angle = (Math.PI * 2 * index) / count + Math.random() * 0.45;
    const distance = 40 + Math.random() * 65;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance - (20 + Math.random() * 30);

    node.style.setProperty("--dx", `${dx}px`);
    node.style.setProperty("--dy", `${dy}px`);
    document.body.appendChild(node);
    window.setTimeout(() => node.remove(), 820);
  }
}

function getAudio() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return null;
  }

  if (!audioContext) {
    audioContext = new AudioContextClass();
  }

  return audioContext;
}

async function unlockAudio() {
  const context = getAudio();
  if (!context || context.state === "running") {
    return;
  }

  try {
    await context.resume();
  } catch {
    // Ignore browser-specific autoplay restrictions.
  }
}

function playTone({ frequency, type = "sine", duration = 0.08, gain = 0.04, detune = 0 }) {
  const context = getAudio();
  if (!context) {
    return;
  }

  const oscillator = context.createOscillator();
  const gainNode = context.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  oscillator.detune.value = detune;
  gainNode.gain.value = 0;

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);

  const now = context.currentTime;
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(gain, now + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.02);
}

function playClickSound() {
  playTone({ frequency: 620, type: "triangle", duration: 0.06, gain: 0.03 });
  window.setTimeout(() => playTone({ frequency: 880, type: "sine", duration: 0.045, gain: 0.018 }), 35);
}

function playPurchaseSound() {
  playTone({ frequency: 420, type: "square", duration: 0.08, gain: 0.03 });
  window.setTimeout(() => playTone({ frequency: 560, type: "triangle", duration: 0.08, gain: 0.025 }), 70);
}

function playUpgradeSound() {
  playTone({ frequency: 660, type: "sine", duration: 0.08, gain: 0.035 });
  window.setTimeout(() => playTone({ frequency: 990, type: "triangle", duration: 0.1, gain: 0.03 }), 90);
  window.setTimeout(() => playTone({ frequency: 1320, type: "sine", duration: 0.11, gain: 0.02 }), 180);
}

function addCookies(amount, event, color = "#ffda87") {
  const gain = Math.max(0, Math.floor(amount));
  if (gain <= 0) {
    return;
  }

  state.cookies += gain;
  state.totalCookies += gain;
  updateUI();

  if (event) {
    floatText(`+${formatNumber(gain)} remingtons`, event.clientX, event.clientY);
    spawnParticles(event.clientX, event.clientY, color, 10);
  }
}

function flushProduction() {
  const gained = Math.floor(state.productionRemainder);
  if (gained > 0) {
    state.productionRemainder -= gained;
    state.cookies += gained;
    state.totalCookies += gained;
  }
}

function accumulateProduction(delta) {
  state.productionRemainder += state.cookiesPerSecond * delta;
  flushProduction();
}

function clickCookie(event) {
  void unlockAudio();
  playClickSound();

  addCookies(state.cookiesPerClick, event, "#ffda87");
}

function buyBuilding(id, event) {
  const definition = buildingDefs.find((entry) => entry.id === id);
  if (!definition) {
    return;
  }

  const owned = state.buildings[id];
  const cost = buildingCost(definition, owned);
  if (state.cookies < cost) {
    return;
  }

  void unlockAudio();
  playPurchaseSound();

  state.cookies -= cost;
  state.buildings[id] += 1;
  updateUI();
  saveGame("Shop purchase saved.");

  if (event) {
    spawnParticles(event.clientX, event.clientY, "#8de0cf", 8);
    floatText(`-${formatNumber(cost)} remingtons`, event.clientX, event.clientY);
  }
}

function buyUpgrade(id) {
  const definition = upgradeDefs.find((entry) => entry.id === id);
  if (!definition) {
    return;
  }

  const current = upgradeState(definition);
  if (current.purchased || !current.unlocked || state.cookies < definition.cost) {
    return;
  }

  void unlockAudio();
  playUpgradeSound();

  state.cookies -= definition.cost;
  state.upgrades[id] = true;
  updateUI();
  saveGame("Upgrade purchased.");
}

function unlockSecret(event) {
  const password = window.prompt("Enter the secret password.");
  if (password === null) {
    return;
  }

  if (password.trim().toLowerCase() !== SECRET_PASSWORD) {
    window.alert("Wrong password.");
    return;
  }

  if (!state.secretUnlocked) {
    state.secretUnlocked = true;
    state.secretCpsBonus = SECRET_CPS_BONUS;
    void unlockAudio();
    playUpgradeSound();
    elements.offlineBonus.textContent = "Secret unlocked: +1,000,000,000 remingtons per second.";
    saveGame("Secret unlocked.");
    updateUI();
  } else {
    window.alert("Secret already unlocked.");
  }
}

function saveGame(message = "Game saved.") {
  state.lastSavedAt = Date.now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  elements.saveStatus.textContent = `${message} ${new Date(state.lastSavedAt).toLocaleTimeString()}`;
}

function resetGame() {
  if (!window.confirm("Reset all progress?")) {
    return;
  }

  localStorage.removeItem(STORAGE_KEY);
  Object.assign(state, {
    cookies: 0,
    totalCookies: 0,
    cookiesPerClick: 1,
    cookiesPerSecond: 0,
    activeTab: "shop",
    productionRemainder: 0,
    displayCookies: 0,
    secretUnlocked: false,
    secretCpsBonus: 0,
    buildings: Object.fromEntries(buildingDefs.map((building) => [building.id, 0])),
    upgrades: Object.fromEntries(upgradeDefs.map((upgrade) => [upgrade.id, false])),
    lastSavedAt: Date.now(),
  });
  elements.offlineBonus.textContent = "";
  updateUI();
  saveGame("Progress reset.");
}

function applyOfflineProgress(saved) {
  const elapsedMs = Date.now() - (saved.lastSavedAt ?? Date.now());
  const elapsedSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
  state.productionRemainder += elapsedSeconds * totalCps();
  flushProduction();

  if (state.cookies > Number(saved.cookies || 0)) {
    const gained = state.cookies - (Number(saved.cookies) || 0);
    if (gained > 0) {
      elements.offlineBonus.textContent = `Offline remington bonus: +${formatNumber(gained)} remingtons while you were away.`;
    }
  }
}

function loadGame() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return;
  }

  try {
    const saved = JSON.parse(raw);
    state.cookies = Math.floor(Number(saved.cookies) || 0);
    state.totalCookies = Math.floor(Number(saved.totalCookies) || 0);
    state.cookiesPerClick = Number(saved.cookiesPerClick) || 1;
    state.activeTab = saved.activeTab === "upgrades" ? "upgrades" : "shop";
    state.productionRemainder = Number(saved.productionRemainder) || 0;
    state.displayCookies = state.cookies;
    state.secretUnlocked = Boolean(saved.secretUnlocked);
    state.secretCpsBonus = state.secretUnlocked ? SECRET_CPS_BONUS : 0;
    state.buildings = Object.fromEntries(
      buildingDefs.map((building) => [building.id, Number(saved.buildings?.[building.id]) || 0]),
    );
    state.upgrades = Object.fromEntries(
      upgradeDefs.map((upgrade) => [upgrade.id, Boolean(saved.upgrades?.[upgrade.id])]),
    );
    state.lastSavedAt = Number(saved.lastSavedAt) || Date.now();
    updateDerivedStats();
    applyOfflineProgress(saved);
    state.displayCookies = state.cookies;
    elements.saveStatus.textContent = `Loaded remington save from ${new Date(state.lastSavedAt).toLocaleString()}.`;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function startAutoLoop() {
  let lastFrame = performance.now();

  function tick(now) {
    const delta = (now - lastFrame) / 1000;
    lastFrame = now;

    accumulateProduction(delta);
    updateDisplayedCookies(delta);
    renderStats();

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

function attachEvents() {
  elements.cookieButton.addEventListener("click", clickCookie);
  elements.saveButton.addEventListener("click", () => saveGame());
  elements.resetButton.addEventListener("click", resetGame);
  elements.secretButton.addEventListener("click", unlockSecret);
  elements.shopTab.addEventListener("click", () => setActiveTab("shop"));
  elements.upgradeTab.addEventListener("click", () => setActiveTab("upgrades"));
  window.addEventListener("beforeunload", () => saveGame("Auto-saved."));
}

function init() {
  loadGame();
  updateUI();
  attachEvents();
  startAutoLoop();
  window.setInterval(() => saveGame("Auto-saved."), 30000);
}

init();
