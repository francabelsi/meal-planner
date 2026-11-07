let manualShopping =
JSON.parse(
    localStorage.getItem("manualShopping")
) || [];

let recipes =
JSON.parse(localStorage.getItem("recipes")) || {};

let pantry =
JSON.parse(localStorage.getItem("pantry")) || [];

let weekPlan =
JSON.parse(localStorage.getItem("weekPlan")) || {};

let priceList = [];

let customPrices =
JSON.parse(localStorage.getItem("customPrices")) || [];

let productOptionsHtml = null;

const productMatchCache = {};

const days = [
    "Lunedì",
    "Martedì",
    "Mercoledì",
    "Giovedì",
    "Venerdì",
    "Sabato",
    "Domenica"
];

function removeShoppingItem(button){

    const li = button.parentElement;

    // Una voce manuale eliminata non deve ricomparire alla prossima generazione
    if(li.dataset.manual === "1"){

        const i = manualShopping.indexOf(li.dataset.nome);

        if(i >= 0)
            manualShopping.splice(i, 1);
    }

    li.remove();

    updateShoppingTotals();
    saveShoppingList();

}

async function saveData(){

    const db =
        window.firebaseDb;

    if(!db){

        localStorage.setItem(
            "manualShopping",
            JSON.stringify(manualShopping)
        );

        localStorage.setItem(
            "recipes",
            JSON.stringify(recipes)
        );

        localStorage.setItem(
            "weekPlan",
            JSON.stringify(weekPlan)
        );

        localStorage.setItem(
            "priceLinks",
            JSON.stringify(priceLinks)
        );

        localStorage.setItem(
            "shoppingList",
            JSON.stringify(shoppingList)
        );

        localStorage.setItem(
            "customPrices",
            JSON.stringify(customPrices)
        );

        return;
    }

    await window.firebaseSetDoc(

        window.firebaseDoc(
            db,
            "mealplanner",
            "main"
        ),

        {

            recipes: recipes,

            weekPlan: weekPlan,

            manualShopping: manualShopping,

            priceLinks: priceLinks,

            shoppingList: shoppingList,

            customPrices: customPrices

        }

    );

}

function showTab(tab){

    document
        .querySelectorAll(".tab")
        .forEach(t => t.classList.add("hidden"));

    document
        .getElementById(tab)
        .classList.remove("hidden");
}

function addRecipe(){

    const name =
        document.getElementById(
            "recipeName"
        ).value.trim();

    const ingredients =
        document.getElementById(
            "recipeIngredients"
        )
        .value
        .split("\n")
        .map(line => {

            const parts = line.split("|");

            return {
                nome: parts[0]?.trim(),
                quantita: Number(parts[1]) || 0,
                unita: parts[2]?.trim() || ""
            };

        })
        .filter(i => i.nome);

    if(!name || ingredients.length === 0)
        return;

    if(recipeInPlan(name))
        invalidateShoppingList();

    recipes[name] = ingredients;

    saveData();
    renderRecipes();
    renderPlanner();

    document.getElementById(
        "recipeName"
    ).value = "";

    document.getElementById(
        "recipeIngredients"
    ).value = "";
}

function renderRecipes(){

    const ul =
        document.getElementById(
            "recipeList"
        );

    ul.innerHTML = "";

    Object.keys(recipes).forEach(recipe => {

        const li =
            document.createElement("li");

        li.innerHTML = `
            <strong>${recipe}</strong>

            <button onclick="editRecipe('${recipe}')">
                Modifica
            </button>

            <button onclick="deleteRecipe('${recipe}')">
                Elimina
            </button>
        `;

        ul.appendChild(li);

    });

}

function editRecipe(recipe){

    document.getElementById(
        "recipeName"
    ).value = recipe;

    document.getElementById(
        "recipeIngredients"
    ).value = recipes[recipe]
        .map(i =>
            `${i.nome}|${i.quantita}|${i.unita}`
        )
        .join("\n");

}

function deleteRecipe(recipe){

    if(!confirm("Eliminare la ricetta?"))
        return;

    if(recipeInPlan(recipe))
        invalidateShoppingList();

    delete recipes[recipe];

    saveData();

    renderRecipes();
    renderPlanner();
    renderWeekSummary();
}

function renderPlanner(){

    const container =
        document.getElementById(
            "weekContainer"
        );

    container.innerHTML = "";

    days.forEach(day => {

        const div =
            document.createElement("div");

        div.className = "day";

        let options =
            '<option value="">-- scegli --</option>';

        Object.keys(recipes)
            .forEach(recipe => {

                options += `
                    <option value="${recipe}">
                        ${recipe}
                    </option>
                `;
            });

        const lunch =
            weekPlan[day]?.pranzo || "";

        const dinner =
            weekPlan[day]?.cena || "";

        div.innerHTML = `

            <h3>${day}</h3>

            <label>Pranzo</label>

            <select
                onchange="setMeal('${day}','pranzo',this.value)">

                ${options}

            </select>

            <label>Cena</label>

            <select
                onchange="setMeal('${day}','cena',this.value)">

                ${options}

            </select>

        `;

        container.appendChild(div);

        const selects =
            div.querySelectorAll("select");

        selects[0].value = lunch;
        selects[1].value = dinner;

    });
    renderWeekSummary();
}

function setMeal(
    day,
    meal,
    recipe
){

    if(!weekPlan[day])
        weekPlan[day] = {};

    weekPlan[day][meal] = recipe;

    invalidateShoppingList();

    saveData();

    renderWeekSummary();
}

function addPantryItem(){

    const item =
        document.getElementById(
            "pantryItem"
        ).value.trim();

    if(!item)
        return;

    pantry.push(item);

    saveData();

    renderPantry();

    document.getElementById(
        "pantryItem"
    ).value = "";
}

function renderPantry(){

    const ul =
        document.getElementById(
            "pantryList"
        );

    ul.innerHTML = "";

    pantry.forEach(item => {

        const li =
            document.createElement("li");

        li.textContent = item;

        ul.appendChild(li);

    });

}

function recipeInPlan(name){

    return Object.values(weekPlan).some(day =>
        Object.values(day).includes(name)
    );
}

function buildItemsFromPlan(){

    const totale = {};

    Object.values(weekPlan).forEach(day => {

        Object.values(day).forEach(recipe => {

            if(!recipe || !recipes[recipe])
                return;

            recipes[recipe].forEach(ingrediente => {

                const key =
                    ingrediente.nome +
                    "_" +
                    ingrediente.unita;

                if(!totale[key]){

                    totale[key] = {
                        nome: ingrediente.nome,
                        quantita: 0,
                        unita: ingrediente.unita
                    };

                }

                totale[key].quantita +=
                    ingrediente.quantita;

            });

        });

    });

    const items = Object.values(totale)
        .sort((a, b) => a.nome.localeCompare(b.nome))
        .map(i => ({
            nome: i.nome,
            quantita: Math.round(i.quantita * 100) / 100,
            unita: i.unita,
            manual: false
        }));

    manualShopping.forEach(nome => {

        items.push({
            nome: nome,
            quantita: 1,
            unita: "",
            manual: true
        });

    });

    return items;
}

function generateShoppingList(force){

    const giaPresente =
        document.querySelectorAll("#shoppingList li").length > 0;

    if(!force && giaPresente &&
        !confirm("Rigenerare la lista? Le quantità e le confezioni modificate verranno azzerate."))
        return;

    renderShoppingItems(buildItemsFromPlan());

    saveShoppingList();
}

function addManualShoppingItem(){

    const item =
        document.getElementById(
            "manualShoppingItem"
        ).value.trim();

    if(!item)
        return;

    manualShopping.push(item);

    document.getElementById(
        "manualShoppingItem"
    ).value = "";

    // Se la lista esiste già aggiungo solo la voce, senza azzerare il resto
    if(shoppingList !== null){

        const items = readShoppingState();

        items.push({
            nome: item,
            quantita: 1,
            unita: "",
            conf: 1,
            key: null,
            manual: true
        });

        renderShoppingItems(items);
        saveShoppingList();

    }else{

        generateShoppingList(true);
    }

    saveData();
}

function renderWeekSummary(){

    const table =
        document.getElementById(
            "weekSummary"
        );

    table.innerHTML = `
        <tr>
            <th>Giorno</th>
            <th>Pranzo</th>
            <th>Cena</th>
        </tr>
    `;

    days.forEach(day => {

        const pranzo =
            (weekPlan[day] && weekPlan[day].pranzo)
            ? weekPlan[day].pranzo
            : "-";

        const cena =
            (weekPlan[day] && weekPlan[day].cena)
            ? weekPlan[day].cena
            : "-";

        table.innerHTML += `
            <tr>
                <td>${day}</td>
                <td>${pranzo}</td>
                <td>${cena}</td>
            </tr>
        `;

    });
    
}

async function loadData(){

    try{

        const snapshot =
            await window.firebaseGetDoc(

                window.firebaseDoc(
                    window.firebaseDb,
                    "mealplanner",
                    "main"
                )

            );

        if(snapshot.exists()){

            const data =
                snapshot.data();

            recipes =
                data.recipes || {};

            weekPlan =
                data.weekPlan || {};

            manualShopping =
                data.manualShopping || [];

            priceLinks =
                data.priceLinks || priceLinks;

            shoppingList =
                data.shoppingList || null;

            if(Array.isArray(data.customPrices)){

                customPrices = data.customPrices;

                rebuildPriceList();
            }

        }

        renderRecipes();
        renderPlanner();
        renderWeekSummary();
        renderPrices();

        // Ripristina la lista della spesa salvata (con quantità e confezioni)
        if(shoppingList && Array.isArray(shoppingList.items))
            renderShoppingItems(shoppingList.items);

    }
    catch(error){

        console.log(error);

    }

}

setTimeout(() => {

    loadData();

}, 1500);


/* ===== Database prezzi ===== */

const expandedPrices = new Set();

let editingPriceId = null;

function escapeHtml(text){
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function formatEuro(n){
    return n.toFixed(2).replace(".", ",") + " €";
}

function formatDate(iso){
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
}

function prettyName(name){
    return name.charAt(0) + name.slice(1).toLowerCase();
}

// Ricerca senza maiuscole/accenti, anche parziale e singolare/plurale
function matchesSearch(nome, query){

    const qTokens = normTokens(query);

    if(qTokens.length === 0)
        return true;

    const pTokens = normTokens(nome);
    const flat = pTokens.join(" ");

    return qTokens.every(q =>
        flat.includes(q) ||
        pTokens.some(t => tokenMatch(q, t))
    );
}

function todayIso(){

    const d = new Date();

    return d.getFullYear() + "-" +
        String(d.getMonth() + 1).padStart(2, "0") + "-" +
        String(d.getDate()).padStart(2, "0");
}

function customToProduct(c){

    return {
        id: c.id,
        n: c.n,
        u: c.u,
        h: c.h.map(e => [e.d, e.p])
    };
}

// Unisce i prezzi base (prices.js) con le modifiche e i prodotti aggiunti
function rebuildPriceList(){

    const base = typeof priceDB === "undefined" ? [] : priceDB;

    const custom = new Map(customPrices.map(c => [c.id, c]));
    const baseIds = new Set();

    priceList = base.map(p => {

        const id = p.n + "|" + p.u;

        baseIds.add(id);

        const c = custom.get(id);

        return c
            ? customToProduct(c)
            : { id: id, n: p.n, u: p.u, h: p.h };

    });

    customPrices.forEach(c => {

        if(!baseIds.has(c.id))
            priceList.push(customToProduct(c));

    });

    productOptionsHtml = null;

    Object.keys(productMatchCache)
        .forEach(k => delete productMatchCache[k]);
}

function saveCustomProduct(p){

    const c = {
        id: p.id,
        n: p.n,
        u: p.u,
        h: p.h.map(e => ({ d: e[0], p: e[1] }))
    };

    const i = customPrices.findIndex(x => x.id === p.id);

    if(i >= 0)
        customPrices[i] = c;
    else
        customPrices.push(c);
}

function priceNameTaken(nome, unita, exceptId){

    const n = nome.trim().toLowerCase();

    return priceList.some(p =>
        p.id !== exceptId &&
        p.u === unita &&
        p.n.trim().toLowerCase() === n
    );
}

// Dopo ogni modifica: ricostruisco l'elenco e aggiorno anche la lista della spesa
function afterPriceEdit(){

    rebuildPriceList();
    renderPrices();

    if(document.querySelectorAll("#shoppingList li").length > 0)
        renderShoppingItems(readShoppingState());
}

function addPriceProduct(){

    const nome =
        document.getElementById("newPriceName").value.trim();

    const unita =
        document.getElementById("newPriceUnit").value;

    const prezzo =
        parseFloat(document.getElementById("newPriceValue").value);

    if(!nome){
        alert("Inserisci il nome del prodotto.");
        return;
    }

    if(isNaN(prezzo) || prezzo < 0){
        alert("Inserisci un prezzo valido.");
        return;
    }

    if(priceNameTaken(nome, unita, null)){
        alert("Esiste già un prodotto con questo nome.");
        return;
    }

    saveCustomProduct({
        id: "custom|" + Date.now(),
        n: nome,
        u: unita,
        h: [[todayIso(), Math.round(prezzo * 100) / 100]]
    });

    saveData();

    document.getElementById("newPriceName").value = "";
    document.getElementById("newPriceValue").value = "";

    // mostro subito il prodotto appena aggiunto
    document.getElementById("priceSearch").value = nome;

    afterPriceEdit();
}

function startPriceEdit(id){

    editingPriceId = id;

    renderPrices();
}

function cancelPriceEdit(){

    editingPriceId = null;

    renderPrices();
}

function savePriceEdit(){

    const p = priceList.find(x => x.id === editingPriceId);

    if(!p)
        return;

    const nome =
        document.getElementById("editPriceName").value.trim();

    const unita =
        document.getElementById("editPriceUnit").value;

    const prezzo =
        parseFloat(document.getElementById("editPriceValue").value);

    if(!nome){
        alert("Inserisci il nome del prodotto.");
        return;
    }

    if(isNaN(prezzo) || prezzo < 0){
        alert("Inserisci un prezzo valido.");
        return;
    }

    if(priceNameTaken(nome, unita, p.id)){
        alert("Esiste già un prodotto con questo nome.");
        return;
    }

    const h = p.h.map(e => [e[0], e[1]]);
    const nuovo = Math.round(prezzo * 100) / 100;
    const ultimo = h[h.length - 1];

    // Se il prezzo cambia lo registro come prezzo di oggi (lo storico resta)
    if(Math.round(ultimo[1] * 100) !== Math.round(nuovo * 100)){

        const oggi = todayIso();

        if(ultimo[0] === oggi)
            ultimo[1] = nuovo;
        else
            h.push([oggi, nuovo]);
    }

    saveCustomProduct({ id: p.id, n: nome, u: unita, h: h });

    editingPriceId = null;

    saveData();

    afterPriceEdit();
}

function renderPrices(){

    const table = document.getElementById("priceTable");

    if(!table)
        return;

    if(priceList.length === 0 && typeof priceDB === "undefined"){

        table.innerHTML = "";

        document.getElementById("priceCount").textContent =
            "Database prezzi non caricato: controlla che il file " +
            "prices.js sia nella stessa cartella di index.html.";

        return;
    }

    const query =
        document.getElementById("priceSearch").value;

    const sort =
        document.getElementById("priceSort").value;

    const list = priceList
        .map(p => {

            const prezzi = p.h.map(e => e[1]);

            return {
                id: p.id,
                nome: p.n,
                u: p.u,
                unita: p.u === "kg" ? "/kg" : "",
                storico: p.h,
                ultimo: prezzi[prezzi.length - 1],
                min: Math.min(...prezzi),
                max: Math.max(...prezzi),
                medio: prezzi.reduce((a, b) => a + b, 0) / prezzi.length
            };

        })
        .filter(p => matchesSearch(p.nome, query));

    if(sort === "acquisti")
        list.sort((a, b) => b.storico.length - a.storico.length);
    else if(sort === "prezzoAsc")
        list.sort((a, b) => a.ultimo - b.ultimo);
    else if(sort === "prezzoDesc")
        list.sort((a, b) => b.ultimo - a.ultimo);
    else
        list.sort((a, b) => a.nome.localeCompare(b.nome));

    let html = `
        <tr>
            <th>Prodotto</th>
            <th>Ultimo</th>
            <th>Min</th>
            <th>Max</th>
            <th>Medio</th>
            <th>Acquisti</th>
            <th></th>
        </tr>
    `;

    list.forEach(p => {

        const open = expandedPrices.has(p.id);

        html += `
            <tr class="price-row"
                data-key="${escapeHtml(p.id)}">
                <td>${open ? "▾" : "▸"} ${escapeHtml(prettyName(p.nome))}</td>
                <td>${formatEuro(p.ultimo)}${p.unita}</td>
                <td>${formatEuro(p.min)}${p.unita}</td>
                <td>${formatEuro(p.max)}${p.unita}</td>
                <td>${formatEuro(p.medio)}${p.unita}</td>
                <td>${p.storico.length}</td>
                <td>
                    <button
                        class="price-edit-btn"
                        data-id="${escapeHtml(p.id)}"
                        title="Modifica">✎</button>
                </td>
            </tr>
        `;

        if(editingPriceId === p.id){

            html += `
                <tr class="price-edit">
                    <td colspan="7">
                        <div class="price-edit-grid">

                            <label>Nome
                                <input
                                    id="editPriceName"
                                    value="${escapeHtml(prettyName(p.nome))}">
                            </label>

                            <label>Unità
                                <select id="editPriceUnit">
                                    <option value="pz"${p.u === "pz" ? " selected" : ""}>a confezione (€/pz)</option>
                                    <option value="kg"${p.u === "kg" ? " selected" : ""}>al peso (€/kg)</option>
                                </select>
                            </label>

                            <label>Prezzo attuale (€)
                                <input
                                    id="editPriceValue"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value="${p.ultimo.toFixed(2)}">
                            </label>

                            <div class="price-edit-actions">
                                <button onclick="savePriceEdit()">Salva</button>
                                <button class="secondary" onclick="cancelPriceEdit()">Annulla</button>
                            </div>

                        </div>
                    </td>
                </tr>
            `;
        }

        if(open){

            const righe = p.storico
                .slice()
                .reverse()
                .map(e =>
                    `<span>${formatDate(e[0])}: <b>${formatEuro(e[1])}${p.unita}</b></span>`
                )
                .join("");

            html += `
                <tr class="price-history">
                    <td colspan="7">${righe}</td>
                </tr>
            `;
        }

    });

    table.innerHTML = html;

    document.getElementById("priceCount").textContent =
        list.length === 0
            ? "Nessun prodotto trovato"
            : list.length + " prodotti";
}

document
    .getElementById("priceTable")
    .addEventListener("click", e => {

        const btn = e.target.closest(".price-edit-btn");

        if(btn){

            startPriceEdit(btn.dataset.id);

            return;
        }

        const row = e.target.closest(".price-row");

        if(!row)
            return;

        const key = row.dataset.key;

        if(expandedPrices.has(key))
            expandedPrices.delete(key);
        else
            expandedPrices.add(key);

        renderPrices();

    });

rebuildPriceList();
renderPrices();

/* ===== Prezzi nella lista della spesa ===== */

let priceLinks =
JSON.parse(localStorage.getItem("priceLinks")) || {};

let shoppingList = null;

function normTokens(text){
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .split(/[^a-z0-9]+/)
        .filter(t => t.length > 1);
}

function tokenMatch(a, b){

    if(a === b)
        return true;

    // singolare/plurale: stessa lunghezza, cambia solo l'ultima lettera
    return a.length >= 4 &&
        a.length === b.length &&
        a.slice(0, -1) === b.slice(0, -1);
}

function productKeyOf(p){
    return p.id;
}

function findProduct(nome){

    const tokens = normTokens(nome);

    if(tokens.length === 0 || priceList.length === 0)
        return null;

    let best = null;
    let bestScore = -Infinity;

    priceList.forEach(p => {

        const pt = normTokens(p.n);

        const allMatch = tokens.every(t =>
            pt.some(x => tokenMatch(t, x))
        );

        if(!allMatch)
            return;

        const primaParola =
            tokens[0] === pt[0] ? 10 :
            tokenMatch(tokens[0], pt[0]) ? 3 : 0;

        const score =
            - pt.length * 3
            + Math.min(p.h.length, 12) * 0.5
            + primaParola;

        if(score > bestScore){
            best = p;
            bestScore = score;
        }

    });

    return best;
}

function getProductForItem(nome){

    const linkKey = nome.toLowerCase().trim();

    if(linkKey in priceLinks){

        if(priceLinks[linkKey] === "")
            return null;

        return priceList.find(p =>
            productKeyOf(p) === priceLinks[linkKey]
        ) || null;
    }

    if(!(linkKey in productMatchCache))
        productMatchCache[linkKey] = findProduct(nome);

    return productMatchCache[linkKey];
}

// Restituisce { totale, dettaglio } oppure null se non calcolabile
function computeItemPrice(product, unita, qta, confezioni){

    if(!product)
        return null;

    const ultimo = product.h[product.h.length - 1][1];
    const u = (unita || "").toLowerCase().trim();

    // Prodotto venduto al peso: conta la quantità in g o kg
    if(product.u === "kg"){

        let kg = null;

        if(u === "g")
            kg = qta / 1000;
        else if(u === "kg")
            kg = qta;

        if(kg === null)
            return null;

        kg = Math.round(kg * 1000) / 1000;

        return {
            totale: kg * ultimo,
            dettaglio: String(kg).replace(".", ",") +
                " kg × " + formatEuro(ultimo) + "/kg"
        };
    }

    // Prodotto a confezione: conta il numero di confezioni
    return {
        totale: confezioni * ultimo,
        dettaglio: confezioni + " × " + formatEuro(ultimo)
    };
}

function buildProductOptions(){

    let html = '<option value="">— nessun prezzo —</option>';

    [...priceList]
        .sort((a, b) => a.n.localeCompare(b.n))
        .forEach(p => {

        const ultimo = p.h[p.h.length - 1][1];

        html += `<option value="${escapeHtml(productKeyOf(p))}">` +
            escapeHtml(prettyName(p.n)) +
            ` — ${formatEuro(ultimo)}${p.u === "kg" ? "/kg" : ""}` +
            `</option>`;
    });

    return html;
}

function renderShoppingItems(items){

    const ul = document.getElementById("shoppingList");

    ul.innerHTML = "";

    items.forEach(item => {

        const li = document.createElement("li");

        li.dataset.nome = item.nome;
        li.dataset.unita = item.unita || "";

        if(item.manual)
            li.dataset.manual = "1";

        if(item.conf !== undefined && item.conf !== null)
            li.dataset.conf = item.conf;

        if(item.key !== undefined && item.key !== null)
            li.dataset.key = item.key;

        li.innerHTML = `
            <span>${escapeHtml(item.nome)}</span>

            <input
                type="number"
                value="${item.quantita}"
                min="0"
                step="any">

            <span>${escapeHtml(item.unita || "")}</span>

            <button onclick="removeShoppingItem(this)">
                ✖
            </button>
        `;

        ul.appendChild(li);

    });

    decorateShoppingList();
}

function decorateShoppingList(){

    if(priceList.length === 0)
        return;

    if(productOptionsHtml === null)
        productOptionsHtml = buildProductOptions();

    document
        .querySelectorAll("#shoppingList li")
        .forEach(li => {

            const nome = li.dataset.nome;

            const conf =
                li.dataset.conf !== undefined ? li.dataset.conf : 1;

            const pack = document.createElement("span");
            pack.className = "pack-wrap";
            pack.innerHTML =
                '<input type="number" class="pack-input" ' +
                'value="' + conf + '" min="0" step="1" ' +
                'title="Numero di confezioni da comprare">' +
                '<small>conf.</small>';

            const cell = document.createElement("span");
            cell.className = "price-cell";

            const select = document.createElement("select");
            select.className = "price-select";
            select.innerHTML = productOptionsHtml;

            if(li.dataset.key !== undefined){

                select.value = li.dataset.key;

            }else{

                const product = getProductForItem(nome);
                select.value = product ? productKeyOf(product) : "";
            }

            select.addEventListener("change", () => {

                priceLinks[nome.toLowerCase().trim()] = select.value;

                updateShoppingTotals();
                saveShoppingList();

            });

            const button = li.querySelector("button");

            li.insertBefore(pack, button);
            li.insertBefore(cell, button);
            li.insertBefore(select, button);

        });

    updateShoppingTotals();
}

// Legge dalla pagina lo stato attuale della lista
function readShoppingState(){

    const items = [];

    document
        .querySelectorAll("#shoppingList li")
        .forEach(li => {

            const qtyInput = li.querySelector("input:not(.pack-input)");
            const packInput = li.querySelector(".pack-input");
            const select = li.querySelector(".price-select");

            items.push({
                nome: li.dataset.nome,
                quantita: qtyInput ? (Number(qtyInput.value) || 0) : 0,
                unita: li.dataset.unita || "",
                conf: packInput ? (Number(packInput.value) || 0) : 1,
                key: select ? select.value : "",
                manual: li.dataset.manual === "1"
            });

        });

    return items;
}

let shoppingSaveTimer = null;

// Salva la lista (anche su Firestore, quindi visibile dal telefono)
function saveShoppingList(){

    shoppingList = { items: readShoppingState() };

    clearTimeout(shoppingSaveTimer);

    shoppingSaveTimer = setTimeout(saveData, 600);
}

// Il piano è cambiato: la lista salvata non è più valida
function invalidateShoppingList(){

    const ul = document.getElementById("shoppingList");

    if(!ul)
        return;

    if(shoppingList === null && ul.children.length === 0)
        return;

    shoppingList = null;

    ul.innerHTML = "";

    const totale = document.getElementById("shoppingTotal");

    if(totale)
        totale.innerHTML =
            '<small>Il piano è cambiato: premi "Genera Lista" per aggiornare la lista della spesa.</small>';
}

function updateShoppingTotals(){

    if(document.querySelectorAll("#shoppingList li").length === 0){

        // lista vuota: tolgo il totale, ma lascio l'avviso di piano modificato
        if(shoppingList !== null){

            const t = document.getElementById("shoppingTotal");

            if(t)
                t.innerHTML = "";
        }

        return;
    }

    let somma = 0;
    let senzaPrezzo = 0;

    document
        .querySelectorAll("#shoppingList li")
        .forEach(li => {

            const cell = li.querySelector(".price-cell");
            const select = li.querySelector(".price-select");
            const qtyInput = li.querySelector("input:not(.pack-input)");
            const packInput = li.querySelector(".pack-input");

            if(!cell || !select || !qtyInput || !packInput)
                return;

            const product = priceList.find(p =>
                productKeyOf(p) === select.value
            ) || null;

            const alPeso = !!product && product.u === "kg";

            // Per i prodotti al peso le confezioni non servono
            packInput.disabled = alPeso;
            packInput.parentElement.style.opacity = alPeso ? "0.35" : "1";

            const qta = Number(qtyInput.value) || 0;

            const conf = Math.max(
                0,
                Math.floor(Number(packInput.value)) || 0
            );

            const res = computeItemPrice(
                product,
                li.dataset.unita,
                qta,
                conf
            );

            if(!res){

                cell.textContent = "—";

                cell.title = product
                    ? "Prodotto al kg: serve una quantità in g o kg"
                    : "Nessun prezzo associato";

                senzaPrezzo++;
                return;
            }

            somma += res.totale;

            cell.title = "";

            cell.innerHTML =
                formatEuro(res.totale) +
                "<small>" + escapeHtml(res.dettaglio) + "</small>";

        });

    const totale =
        document.getElementById("shoppingTotal");

    if(!totale)
        return;

    const nota = senzaPrezzo > 0
        ? `${senzaPrezzo} voci senza prezzo non incluse.`
        : "";

    totale.innerHTML =
        `Totale stimato: ${formatEuro(somma)}` +
        (nota ? `<small>${nota}</small>` : "");
}

document
    .getElementById("shoppingList")
    .addEventListener("input", () => {

        updateShoppingTotals();
        saveShoppingList();

    });
