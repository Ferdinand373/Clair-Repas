/*
CLAIR REPAS — CHANTIER 6
Accueil du Livre — module d'interface non destructif

Objectif :
- réorganiser l'accueil du Livre ;
- ne créer, supprimer ou dupliquer aucune recette ;
- travailler à partir des objets recette déjà présents ;
- laisser l'application existante décider comment ouvrir une recette,
  une collection ou "Mon Livre".

Le module ne lit et n'écrit aucun localStorage.
Il n'impose aucun nom de tableau interne.
Il reçoit tout par adaptateur.
*/

(function (global) {
  "use strict";

  const normalize = (value) => String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  const textOf = (value) => {
    if (Array.isArray(value)) return value.map(textOf).join(" ");
    if (value && typeof value === "object") {
      return Object.values(value).map(textOf).join(" ");
    }
    return String(value ?? "");
  };

  const uniqRecipes = (recipes) => {
    const seen = new Set();
    const out = [];
    for (const recipe of recipes || []) {
      if (!recipe || typeof recipe !== "object") continue;
      // Priorité : id stable. Sinon titre normalisé comme filet de sécurité.
      const key = recipe.id ? "id:" + recipe.id : "n:" + normalize(recipe.n || recipe.name || recipe.title);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(recipe);
    }
    return out;
  };

  const recipeTitle = (r) => r?.n || r?.name || r?.title || "Recette";
  const recipeTime = (r) => r?.t || r?.time || r?.duration || "";
  const recipeMethod = (r) => r?.m || r?.method || "";
  const recipeCollections = (r) => Array.isArray(r?.collections) ? r.collections : [];

  const searchHaystack = (r) => normalize([
    recipeTitle(r),
    r?.family,
    r?.cuisine,
    r?.region,
    r?.chef,
    r?.course,
    r?.kind,
    r?.aperitifType,
    recipeMethod(r),
    textOf(r?.core),
    textOf(r?.i),
    textOf(recipeCollections(r))
  ].join(" "));

  const defaultSearch = (recipes, query) => {
    const q = normalize(query);
    if (!q) return recipes;
    const tokens = q.split(/\s+/).filter(Boolean);
    return recipes.filter((r) => {
      const haystack = searchHaystack(r);
      return tokens.every((token) => haystack.includes(token));
    });
  };

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  };

  const button = (className, label, onClick) => {
    const b = el("button", className);
    b.type = "button";
    b.textContent = label;
    b.addEventListener("click", onClick);
    return b;
  };

  function renderRecipeCard(recipe, api) {
    const card = button("cr-book-recipe-card", "", () => api.openRecipe?.(recipe));
    card.setAttribute("aria-label", "Ouvrir " + recipeTitle(recipe));

    const title = el("span", "cr-book-recipe-title", recipeTitle(recipe));
    card.appendChild(title);

    const metaValues = [recipeTime(recipe), recipeMethod(recipe)].filter(Boolean).slice(0, 2);
    if (metaValues.length) {
      card.appendChild(el("span", "cr-book-recipe-meta", metaValues.join(" · ")));
    }
    return card;
  }

  function findShelf(bookShelves, wanted) {
    const candidates = wanted.matchTitles.map(normalize);
    return (bookShelves || []).find((shelf) => {
      const title = normalize(shelf?.title);
      return candidates.some((candidate) => title === candidate || title.includes(candidate));
    });
  }

  function renderCollectionCard(parent, shelf, icon, api) {
    if (!shelf) return;
    const b = button("cr-book-collection-card", "", () => api.openCollection?.(shelf));
    const top = el("span", "cr-book-collection-icon", icon || shelf.icon || "📚");
    const title = el("span", "cr-book-collection-title", shelf.title || "Collection");
    const desc = el("span", "cr-book-collection-desc", shelf.description || "");
    b.append(top, title);
    if (desc.textContent) b.appendChild(desc);
    parent.appendChild(b);
  }

  function renderChip(parent, item, onClick) {
    const b = button("cr-book-chip", `${item.icon ? item.icon + " " : ""}${item.label}`, onClick);
    parent.appendChild(b);
  }

  function createEmptyState(message) {
    const wrap = el("div", "cr-book-empty");
    wrap.appendChild(el("div", "cr-book-empty-icon", "🔎"));
    wrap.appendChild(el("p", "", message));
    return wrap;
  }

  function init(options) {
    const {
      mount,
      getRecipes,
      bookShelves = [],
      config,
      openRecipe,
      openCollection,
      filterByType,
      filterByMood,
      openMyBook,
      myBookEnabled = Boolean(openMyBook),
      maxSearchResults = 60
    } = options || {};

    if (!mount) throw new Error("Clair Repas Chantier 6 : mount manquant.");
    if (typeof getRecipes !== "function") throw new Error("Clair Repas Chantier 6 : getRecipes manquant.");
    if (!config) throw new Error("Clair Repas Chantier 6 : config manquante.");

    const api = {openRecipe, openCollection, filterByType, filterByMood, openMyBook};
    const recipes = uniqRecipes(getRecipes());

    mount.innerHTML = "";
    mount.classList.add("cr-book-home");

    const header = el("header", "cr-book-header");
    header.appendChild(el("h1", "cr-book-heading", `📖 ${config.title || "Le Livre"}`));
    header.appendChild(el("p", "cr-book-subtitle", config.subtitle || ""));
    mount.appendChild(header);

    // Recherche = premier geste proposé à l'utilisateur.
    const searchBox = el("section", "cr-book-search");
    const input = el("input", "cr-book-search-input");
    input.type = "search";
    input.placeholder = "Rechercher une recette, un ingrédient, une région…";
    input.autocomplete = "off";
    input.spellcheck = false;
    input.setAttribute("aria-label", "Rechercher dans Le Livre");
    searchBox.appendChild(input);

    const results = el("div", "cr-book-search-results");
    results.hidden = true;
    searchBox.appendChild(results);
    mount.appendChild(searchBox);

    const renderSearch = () => {
      const q = input.value.trim();
      results.innerHTML = "";
      if (!q) {
        results.hidden = true;
        return;
      }
      const found = defaultSearch(recipes, q).slice(0, maxSearchResults);
      results.hidden = false;

      const head = el("div", "cr-book-results-head");
      head.appendChild(el("strong", "", `${found.length} résultat${found.length > 1 ? "s" : ""}`));
      results.appendChild(head);

      if (!found.length) {
        results.appendChild(createEmptyState("Aucune recette ne correspond à cette recherche."));
        return;
      }

      const grid = el("div", "cr-book-results-grid");
      found.forEach((r) => grid.appendChild(renderRecipeCard(r, api)));
      results.appendChild(grid);
    };

    input.addEventListener("input", renderSearch);

    // Grandes collections : peu nombreuses, éditoriales, visibles immédiatement.
    const primary = el("section", "cr-book-section");
    primary.appendChild(el("h2", "cr-book-section-title", "Grandes collections"));
    primary.appendChild(el("p", "cr-book-section-intro",
      "Les grandes portes d’entrée éditoriales de Clair Repas."));
    const primaryGrid = el("div", "cr-book-collection-grid");

    (config.primaryCollections || []).forEach((wanted) => {
      const shelf = findShelf(bookShelves, wanted);
      if (shelf) renderCollectionCard(primaryGrid, shelf, wanted.icon, api);
    });

    // Le nouveau chapitre Apéritifs peut être visible parmi toutes les collections,
    // sans forcer sa présence dans les six collections principales.
    primary.appendChild(primaryGrid);
    mount.appendChild(primary);

    // Explorer : filtres de navigation, distincts des collections éditoriales.
    const explorer = el("section", "cr-book-section");
    explorer.appendChild(el("h2", "cr-book-section-title", "Explorer le Livre"));

    const tabs = el("div", "cr-book-tabs");
    tabs.setAttribute("role", "tablist");

    const panels = el("div", "cr-book-panels");

    const tabDefs = [
      {id:"type", label:"Par type"},
      {id:"mood", label:"Selon l’envie"},
      {id:"all", label:"Toutes les collections"}
    ];

    const panelMap = new Map();
    const activate = (id) => {
      for (const [key, panel] of panelMap) {
        const active = key === id;
        panel.hidden = !active;
        const tab = tabs.querySelector(`[data-tab="${key}"]`);
        if (tab) {
          tab.classList.toggle("is-active", active);
          tab.setAttribute("aria-selected", active ? "true" : "false");
        }
      }
    };

    tabDefs.forEach((def) => {
      const t = button("cr-book-tab", def.label, () => activate(def.id));
      t.dataset.tab = def.id;
      t.setAttribute("role", "tab");
      t.setAttribute("aria-selected", "false");
      tabs.appendChild(t);

      const panel = el("div", "cr-book-panel");
      panel.dataset.panel = def.id;
      panel.setAttribute("role", "tabpanel");
      panelMap.set(def.id, panel);
      panels.appendChild(panel);
    });

    const typePanel = panelMap.get("type");
    const typeChips = el("div", "cr-book-chip-grid");
    (config.typeFilters || []).forEach((item) => {
      renderChip(typeChips, item, () => filterByType?.(item.id, item));
    });
    typePanel.appendChild(typeChips);

    const moodPanel = panelMap.get("mood");
    const moodChips = el("div", "cr-book-chip-grid");
    (config.moodFilters || []).forEach((item) => {
      renderChip(moodChips, item, () => filterByMood?.(item.id, item));
    });
    moodPanel.appendChild(moodChips);

    const allPanel = panelMap.get("all");
    const allGrid = el("div", "cr-book-collection-grid cr-book-collection-grid--compact");
    (bookShelves || []).forEach((shelf) => renderCollectionCard(allGrid, shelf, shelf.icon, api));
    allPanel.appendChild(allGrid);

    explorer.append(tabs, panels);
    mount.appendChild(explorer);
    activate("type");

    // Mon Livre est optionnel : aucun stockage n'est inventé.
    if (myBookEnabled) {
      const personal = el("section", "cr-book-section cr-book-personal");
      const left = el("div", "");
      left.appendChild(el("h2", "cr-book-section-title", "❤️ Mon Livre"));
      left.appendChild(el("p", "cr-book-section-intro",
        "Retrouver vos favoris, vos recettes à refaire et vos notes."));
      personal.appendChild(left);
      personal.appendChild(button("cr-book-personal-button", "Ouvrir Mon Livre", () => openMyBook?.()));
      mount.appendChild(personal);
    }

    return {
      recipes,
      focusSearch: () => input.focus(),
      refreshSearch: renderSearch
    };
  }

  global.CRBookHome = Object.freeze({
    init,
    normalize,
    uniqRecipes,
    defaultSearch
  });
})(window);
