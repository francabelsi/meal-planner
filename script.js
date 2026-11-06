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

}

function saveData(){

    localStorage.setItem(
        "manualShopping",
        JSON.stringify(manualShopping)
    );

    localStorage.setItem(
        "recipes",
        JSON.stringify(recipes)
    );

    localStorage.setItem(
        "pantry",
        JSON.stringify(pantry)
    );

    localStorage.setItem(
        "weekPlan",
        JSON.stringify(weekPlan)
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

renderRecipes();
renderPlanner();
renderPantry();