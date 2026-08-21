// script.js
// Consome a countries.dev (https://countries.dev/) — API pública, sem necessidade de chave.
//
// Observação: este projeto usava a REST Countries (restcountries.com v3.1), mas essa versão
// foi descontinuada — hoje ela exige conta e chave de API (v5). Como o objetivo é rodar em
// GitHub Pages (site estático, sem backend), trocamos para a countries.dev, que oferece os
// mesmos dados sem exigir autenticação.

const form = document.getElementById("search-form");
const input = document.getElementById("country-input");
const searchBtn = document.getElementById("search-btn");
const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");
const chips = document.querySelectorAll(".chip");

// A API busca pelo nome em inglês. Como o público deste app fala português, traduzimos
// os nomes mais comuns antes de consultar (ex: "frança" -> "france").
const PT_TO_EN = {
  "africa do sul": "south africa", "alemanha": "germany", "arabia saudita": "saudi arabia",
  "argentina": "argentina", "australia": "australia", "austria": "austria", "belgica": "belgium",
  "bolivia": "bolivia", "brasil": "brazil", "canada": "canada", "chile": "chile", "china": "china",
  "colombia": "colombia", "coreia do sul": "south korea", "coreia do norte": "north korea",
  "costa rica": "costa rica", "cuba": "cuba", "dinamarca": "denmark", "egito": "egypt",
  "equador": "ecuador", "escocia": "scotland", "espanha": "spain", "estados unidos": "united states",
  "eua": "united states", "filipinas": "philippines", "franca": "france", "grecia": "greece",
  "holanda": "netherlands", "hungria": "hungary", "india": "india", "inglaterra": "england",
  "irlanda": "ireland", "islandia": "iceland", "italia": "italy", "japao": "japan", "mexico": "mexico",
  "noruega": "norway", "nova zelandia": "new zealand", "paraguai": "paraguay", "peru": "peru",
  "polonia": "poland", "portugal": "portugal", "reino unido": "united kingdom", "russia": "russia",
  "suecia": "sweden", "suica": "switzerland", "turquia": "turkey", "ucrania": "ukraine",
  "uruguai": "uruguay", "venezuela": "venezuela",
};

function toSearchTerm(rawQuery) {
  const normalized = rawQuery
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // remove acentos: "frança" -> "franca"
  return PT_TO_EN[normalized] || rawQuery;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const query = input.value.trim();
  if (!query) return;
  searchCountry(query);
});

chips.forEach((chip) => {
  chip.addEventListener("click", () => {
    const name = chip.dataset.name;
    input.value = name;
    searchCountry(name);
  });
});

async function searchCountry(query) {
  setLoading();

  try {
    const searchTerm = toSearchTerm(query);
    const url = `https://countries.dev/name/${encodeURIComponent(searchTerm)}`;
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Não encontramos nenhum país para "${query}". Tente o nome em inglês (ex: "france") ou confira a grafia.`);
      }
      throw new Error("A API de países respondeu com um erro. Tente novamente em instantes.");
    }

    const data = await response.json();
    // O endpoint /name/{nome} retorna uma lista (pode haver mais de uma correspondência);
    // usamos a primeira.
    renderCountry(data[0]);
    clearStatus();
  } catch (error) {
    // Cobre tanto erros de rede (API fora do ar / sem internet) quanto os erros lançados acima
    const message =
      error instanceof TypeError
        ? "Não foi possível conectar à API de países. Verifique sua internet e tente novamente."
        : error.message;
    showError(message);
    resultEl.hidden = true;
  }
}

function renderCountry(data) {
  // 1) Bandeira
  const flagEl = document.getElementById("country-flag");
  flagEl.src = data.flags?.svg || data.flags?.png || "";
  flagEl.alt = `Bandeira de ${data.name}`;

  // 2) Região / sub-região
  document.getElementById("country-region").textContent =
    [data.region, data.subregion].filter(Boolean).join(" · ");

  // 3) Nome
  document.getElementById("country-name").textContent = data.name;

  // 4) Capital
  document.getElementById("country-capital").textContent = data.capital || "—";

  // 5) População
  document.getElementById("country-population").textContent =
    data.population ? data.population.toLocaleString("pt-BR") + " hab." : "—";

  // 6) Área
  document.getElementById("country-area").textContent =
    data.area ? data.area.toLocaleString("pt-BR") + " km²" : "—";

  // 7) Moeda(s)
  const currencies = Array.isArray(data.currencies)
    ? data.currencies.map((c) => `${c.name} (${c.symbol || "?"})`).join(", ")
    : "—";
  document.getElementById("country-currencies").textContent = currencies;

  // 8) Idioma(s)
  const languages = Array.isArray(data.languages)
    ? data.languages.map((l) => l.name).join(", ")
    : "—";
  document.getElementById("country-languages").textContent = languages;

  // 9) Fronteiras
  const borders = data.borders && data.borders.length ? data.borders.join(", ") : "Nenhuma (país insular ou isolado)";
  document.getElementById("country-borders").textContent = borders;

  resultEl.hidden = false;
}

function setLoading() {
  searchBtn.disabled = true;
  statusEl.dataset.state = "loading";
  statusEl.textContent = "Consultando o atlas...";
}

function clearStatus() {
  searchBtn.disabled = false;
  statusEl.removeAttribute("data-state");
  statusEl.textContent = "";
}

function showError(message) {
  searchBtn.disabled = false;
  statusEl.dataset.state = "error";
  statusEl.textContent = message;
}