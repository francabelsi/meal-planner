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

    button.parentElement.remove();

    updateShoppingTotals();

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

            priceLinks: priceLinks

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

function generateShoppingList(){

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

    const ul =
        document.getElementById(
            "shoppingList"
        );

    ul.innerHTML = "";

    const tuttiGliElementi = [];

    Object.values(totale)
        .sort((a,b) =>
            a.nome.localeCompare(b.nome)
        )
        .forEach(item => {

            tuttiGliElementi.push({
                nome: item.nome,
                quantita: item.quantita,
                unita: item.unita
});
``

        });

    manualShopping.forEach(item => {

        tuttiGliElementi.push(item);

    });

    tuttiGliElementi.forEach(item => {

    const li =
        document.createElement("li");

    if(typeof item === "string"){

        li.innerHTML = `
            <span>${item}</span>

            <input
                type="number"
                value="1"
                min="0">

            <button onclick="removeShoppingItem(this)">
                ✖
            </button>
        `;

    }else{

        li.innerHTML = `
            <span>${item.nome}</span>

            <input
                type="number"
                value="${item.quantita}"
                min="0">

            <span>${item.unita}</span>

            <button onclick="removeShoppingItem(this)">
                ✖
            </button>
        `;

    }

    ul.appendChild(li);

});

    decorateShoppingList();

}



function addManualShoppingItem(){

    const item =
        document.getElementById(
            "manualShoppingItem"
        ).value.trim();

    if(!item)
        return;

    manualShopping.push(item);

    saveData();

    document.getElementById(
        "manualShoppingItem"
    ).value = "";

    generateShoppingList();
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

        }

        renderRecipes();
        renderPlanner();
        renderWeekSummary();

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

function escapeHtml(text){
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
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

function renderPrices(){

    const table = document.getElementById("priceTable");

    if(!table || typeof priceDB === "undefined")
        return;

    const query =
        document.getElementById("priceSearch")
            .value.trim().toLowerCase();

    const sort =
        document.getElementById("priceSort").value;

    const list = priceDB
        .map(p => {

            const prezzi = p.h.map(e => e[1]);

            return {
                key: p.n + "|" + p.u,
                nome: p.n,
                unita: p.u === "kg" ? "/kg" : "",
                storico: p.h,
                ultimo: prezzi[prezzi.length - 1],
                min: Math.min(...prezzi),
                max: Math.max(...prezzi),
                medio: prezzi.reduce((a, b) => a + b, 0) / prezzi.length
            };

        })
        .filter(p => p.nome.toLowerCase().includes(query));

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
        </tr>
    `;

    list.forEach(p => {

        const open = expandedPrices.has(p.key);

        html += `
            <tr class="price-row"
                data-key="${escapeHtml(p.key)}">
                <td>${open ? "▾" : "▸"} ${escapeHtml(prettyName(p.nome))}</td>
                <td>${formatEuro(p.ultimo)}${p.unita}</td>
                <td>${formatEuro(p.min)}${p.unita}</td>
                <td>${formatEuro(p.max)}${p.unita}</td>
                <td>${formatEuro(p.medio)}${p.unita}</td>
                <td>${p.storico.length}</td>
            </tr>
        `;

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
                    <td colspan="6">${righe}</td>
                </tr>
            `;
        }

    });

    table.innerHTML = html;

    document.getElementById("priceCount").textContent =
        list.length + " prodotti";
}

document
    .getElementById("priceTable")
    .addEventListener("click", e => {

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

renderPrices();

/* ===== Prezzi nella lista della spesa ===== */

let priceLinks =
JSON.parse(localStorage.getItem("priceLinks")) || {};

const productMatchCache = {};

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
    return p.n + "|" + p.u;
}

function findProduct(nome){

    const tokens = normTokens(nome);

    if(tokens.length === 0 || typeof priceDB === "undefined")
        return null;

    let best = null;
    let bestScore = -Infinity;

    priceDB.forEach(p => {

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

        return priceDB.find(p =>
            productKeyOf(p) === priceLinks[linkKey]
        ) || null;
    }

    if(!(linkKey in productMatchCache))
        productMatchCache[linkKey] = findProduct(nome);

    return productMatchCache[linkKey];
}

// Restituisce { totale, stimato } oppure null se non calcolabile
function computeItemPrice(product, unita, qta){

    if(!product)
        return null;

    const ultimo = product.h[product.h.length - 1][1];
    const u = (unita || "").toLowerCase().trim();

    if(product.u === "kg"){

        if(u === "g")
            return { totale: qta / 1000 * ultimo, stimato: false };

        if(u === "kg")
            return { totale: qta * ultimo, stimato: false };

        return null;
    }

    if(u === "pz" || u === "")
        return { totale: qta * ultimo, stimato: false };

    // g, ml, ecc. con prodotto a pezzo: stimo 1 confezione
    return { totale: qta > 0 ? ultimo : 0, stimato: true };
}

function buildProductOptions(){

    let html = '<option value="">— nessun prezzo —</option>';

    priceDB.forEach(p => {

        const ultimo = p.h[p.h.length - 1][1];

        html += `<option value="${escapeHtml(productKeyOf(p))}">` +
            escapeHtml(prettyName(p.n)) +
            ` — ${formatEuro(ultimo)}${p.u === "kg" ? "/kg" : ""}` +
            `</option>`;
    });

    return html;
}

let productOptionsHtml = null;

function decorateShoppingList(){

    if(typeof priceDB === "undefined")
        return;

    if(productOptionsHtml === null)
        productOptionsHtml = buildProductOptions();

    document
        .querySelectorAll("#shoppingList li")
        .forEach(li => {

            const nome = li.children[0].textContent.trim();
            const terzo = li.children[2];

            li.dataset.nome = nome;
            li.dataset.unita =
                (terzo && terzo.tagName === "SPAN")
                    ? terzo.textContent.trim()
                    : "pz";

            const cell = document.createElement("span");
            cell.className = "price-cell";

            const select = document.createElement("select");
            select.className = "price-select";
            select.innerHTML = productOptionsHtml;

            const product = getProductForItem(nome);
            select.value = product ? productKeyOf(product) : "";

            select.addEventListener("change", () => {

                priceLinks[nome.toLowerCase().trim()] = select.value;

                saveData();
                updateShoppingTotals();

            });

            const button = li.querySelector("button");

            li.insertBefore(cell, button);
            li.insertBefore(select, button);

        });

    updateShoppingTotals();
}

function updateShoppingTotals(){

    let somma = 0;
    let senzaPrezzo = 0;
    let stimati = 0;

    document
        .querySelectorAll("#shoppingList li")
        .forEach(li => {

            const cell = li.querySelector(".price-cell");
            const select = li.querySelector(".price-select");
            const input = li.querySelector("input");

            if(!cell || !select)
                return;

            const product = priceDB.find(p =>
                productKeyOf(p) === select.value
            ) || null;

            const qta = Number(input.value) || 0;

            const res = computeItemPrice(
                product,
                li.dataset.unita,
                qta
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

            if(res.stimato)
                stimati++;

            cell.textContent =
                (res.stimato ? "~" : "") + formatEuro(res.totale);

            cell.title = res.stimato
                ? "Stima: considero 1 confezione"
                : "";

        });

    const totale =
        document.getElementById("shoppingTotal");

    if(!totale)
        return;

    let nota = "";

    if(stimati > 0)
        nota += `${stimati} voci stimate a 1 confezione (~). `;

    if(senzaPrezzo > 0)
        nota += `${senzaPrezzo} voci senza prezzo non incluse.`;

    totale.innerHTML =
        `Totale stimato: ${formatEuro(somma)}` +
        (nota ? `<small>${nota}</small>` : "");
}

document
    .getElementById("shoppingList")
    .addEventListener("input", updateShoppingTotals);
