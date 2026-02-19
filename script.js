const state = {
  ingredients: load("ingredients", []),
  draftRecipeItems: load("draftRecipeItems", []),
  recipes: load("recipes", []),
  config: load("sizeConfig", {
    foodCostPercent: 30,
  }),
};

const ingredientForm = document.getElementById("ingredient-form");
const ingredientNameInput = document.getElementById("ingredient-name");
const ingredientUnitInput = document.getElementById("ingredient-unit");
const ingredientPriceInput = document.getElementById("ingredient-price");
const ingredientTableWrap = document.getElementById("ingredient-table-wrap");

const recipeNameInput = document.getElementById("recipe-name");
const recipeItemForm = document.getElementById("recipe-item-form");
const recipeIngredientSelect = document.getElementById("recipe-ingredient");
const recipeQtySmallInput = document.getElementById("recipe-qty-small");
const recipeQtyMediumInput = document.getElementById("recipe-qty-medium");
const recipeQtyLargeInput = document.getElementById("recipe-qty-large");
const recipeTableWrap = document.getElementById("recipe-table-wrap");
const savedRecipesWrap = document.getElementById("saved-recipes-wrap");
const saveRecipeBtn = document.getElementById("save-recipe-btn");
const clearDraftBtn = document.getElementById("clear-draft-btn");

const foodCostPercentInput = document.getElementById("food-cost-percent");
const sizeBreakdownWrap = document.getElementById("size-breakdown-wrap");

recipeNameInput.value = load("recipeName", "");
foodCostPercentInput.value = state.config.foodCostPercent;

ingredientForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = ingredientNameInput.value.trim();
  const unit = ingredientUnitInput.value.trim();
  const price = Number(ingredientPriceInput.value);

  if (!name || !unit || Number.isNaN(price) || price < 0) return;

  const normalizedName = name.toLowerCase();
  const existing = state.ingredients.find((item) => item.key === normalizedName);

  if (existing) {
    existing.name = name;
    existing.unit = unit;
    existing.price = price;
  } else {
    state.ingredients.push({ key: normalizedName, name, unit, price });
  }

  persist("ingredients", state.ingredients);
  ingredientForm.reset();
  renderAll();
});

recipeItemForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const ingredientKey = recipeIngredientSelect.value;
  const qtySmall = Number(recipeQtySmallInput.value);
  const qtyMedium = Number(recipeQtyMediumInput.value);
  const qtyLarge = Number(recipeQtyLargeInput.value);

  if (!ingredientKey) return;

  const hasBadValues = [qtySmall, qtyMedium, qtyLarge].some((qty) => Number.isNaN(qty) || qty < 0);
  const allZero = qtySmall === 0 && qtyMedium === 0 && qtyLarge === 0;
  if (hasBadValues || allZero) return;

  const ingredient = state.ingredients.find((item) => item.key === ingredientKey);
  if (!ingredient) return;

  state.draftRecipeItems.push({
    id: crypto.randomUUID(),
    ingredientKey,
    ingredientName: ingredient.name,
    unit: ingredient.unit,
    qtySmall,
    qtyMedium,
    qtyLarge,
  });

  persist("draftRecipeItems", state.draftRecipeItems);
  recipeItemForm.reset();
  renderAll();
});

saveRecipeBtn.addEventListener("click", () => {
  const recipeName = recipeNameInput.value.trim();
  if (!recipeName || !state.draftRecipeItems.length) return;

  state.recipes.push({
    id: crypto.randomUUID(),
    name: recipeName,
    createdAt: new Date().toISOString(),
    items: state.draftRecipeItems,
  });

  state.draftRecipeItems = [];
  persist("recipes", state.recipes);
  persist("draftRecipeItems", state.draftRecipeItems);
  renderAll();
});

clearDraftBtn.addEventListener("click", () => {
  state.draftRecipeItems = [];
  persist("draftRecipeItems", state.draftRecipeItems);
  renderAll();
});

ingredientTableWrap.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-remove-ingredient]");
  if (!button) return;

  const ingredientKey = button.dataset.removeIngredient;
  state.ingredients = state.ingredients.filter((item) => item.key !== ingredientKey);
  state.draftRecipeItems = state.draftRecipeItems.filter((item) => item.ingredientKey !== ingredientKey);

  persist("ingredients", state.ingredients);
  persist("draftRecipeItems", state.draftRecipeItems);
  renderAll();
});

recipeTableWrap.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-remove-draft-item]");
  if (!button) return;

  const itemId = button.dataset.removeDraftItem;
  state.draftRecipeItems = state.draftRecipeItems.filter((item) => item.id !== itemId);
  persist("draftRecipeItems", state.draftRecipeItems);
  renderAll();
});

savedRecipesWrap.addEventListener("click", (event) => {
  const removeButton = event.target.closest("button[data-remove-recipe]");
  if (removeButton) {
    const recipeId = removeButton.dataset.removeRecipe;
    state.recipes = state.recipes.filter((item) => item.id !== recipeId);
    persist("recipes", state.recipes);
    renderSavedRecipes();
    return;
  }

  const loadButton = event.target.closest("button[data-load-recipe]");
  if (!loadButton) return;

  const recipeId = loadButton.dataset.loadRecipe;
  const recipe = state.recipes.find((item) => item.id === recipeId);
  if (!recipe) return;

  recipeNameInput.value = recipe.name;
  persist("recipeName", recipe.name);
  state.draftRecipeItems = recipe.items.map((item) => ({ ...item, id: crypto.randomUUID() }));
  persist("draftRecipeItems", state.draftRecipeItems);
  renderAll();
});

recipeNameInput.addEventListener("input", () => {
  persist("recipeName", recipeNameInput.value);
});

foodCostPercentInput.addEventListener("input", () => {
  state.config = {
    foodCostPercent: Math.max(0.1, Number(foodCostPercentInput.value) || 0.1),
  };

  persist("sizeConfig", state.config);
  renderSizeBreakdown();
});

function renderAll() {
  renderIngredientSelect();
  renderIngredientTable();
  renderDraftRecipeTable();
  renderSavedRecipes();
  renderSizeBreakdown();
}

function renderIngredientSelect() {
  if (!state.ingredients.length) {
    recipeIngredientSelect.innerHTML = '<option value="">Add ingredients first</option>';
    recipeIngredientSelect.disabled = true;
    return;
  }

  recipeIngredientSelect.disabled = false;
  recipeIngredientSelect.innerHTML =
    '<option value="">Choose ingredient</option>' +
    [...state.ingredients]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((item) => `<option value="${item.key}">${item.name} ($${item.price.toFixed(2)}/${item.unit})</option>`)
      .join("");
}

function renderIngredientTable() {
  if (!state.ingredients.length) {
    ingredientTableWrap.innerHTML = '<p class="empty">No ingredients added yet.</p>';
    return;
  }

  ingredientTableWrap.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Ingredient</th>
          <th>Unit</th>
          <th>Price / Unit</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${[...state.ingredients]
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(
            (item) => `
            <tr>
              <td>${item.name}</td>
              <td>${item.unit}</td>
              <td>$${item.price.toFixed(2)}</td>
              <td><button class="btn-danger" data-remove-ingredient="${item.key}" type="button">Remove</button></td>
            </tr>
          `,
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function renderDraftRecipeTable() {
  if (!state.draftRecipeItems.length) {
    recipeTableWrap.innerHTML = '<p class="empty">No draft ingredients yet. Add ingredients first, then create a full recipe.</p>';
    return;
  }

  const withCosts = state.draftRecipeItems.map((item) => {
    const ingredient = state.ingredients.find((ing) => ing.key === item.ingredientKey);
    const unitCost = ingredient ? ingredient.price : 0;

    return {
      ...item,
      ingredientName: ingredient ? ingredient.name : item.ingredientName,
      unit: ingredient ? ingredient.unit : item.unit,
      unitCost,
      totalSmall: item.qtySmall * unitCost,
      totalMedium: item.qtyMedium * unitCost,
      totalLarge: item.qtyLarge * unitCost,
    };
  });

  const totals = withCosts.reduce(
    (sum, item) => ({
      small: sum.small + item.totalSmall,
      medium: sum.medium + item.totalMedium,
      large: sum.large + item.totalLarge,
    }),
    { small: 0, medium: 0, large: 0 },
  );

  recipeTableWrap.innerHTML = `
    <h3>Recipe Draft Items</h3>
    <table>
      <thead>
        <tr>
          <th>Ingredient</th>
          <th>Unit Cost</th>
          <th>Small Qty</th>
          <th>Medium Qty</th>
          <th>Large Qty</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${withCosts
          .map(
            (item) => `
            <tr>
              <td>${item.ingredientName}</td>
              <td>$${item.unitCost.toFixed(2)} / ${item.unit}</td>
              <td>${item.qtySmall.toFixed(2)}</td>
              <td>${item.qtyMedium.toFixed(2)}</td>
              <td>${item.qtyLarge.toFixed(2)}</td>
              <td><button class="btn-danger" data-remove-draft-item="${item.id}" type="button">Remove</button></td>
            </tr>
          `,
          )
          .join("")}
      </tbody>
    </table>
    <div class="kpi">
      <div><span>Recipe Name</span><strong>${recipeNameInput.value.trim() || "Untitled Recipe"}</strong></div>
      <div><span>Small Food Cost</span><strong>$${totals.small.toFixed(2)}</strong></div>
      <div><span>Medium Food Cost</span><strong>$${totals.medium.toFixed(2)}</strong></div>
      <div><span>Large Food Cost</span><strong>$${totals.large.toFixed(2)}</strong></div>
    </div>
  `;
}

function renderSavedRecipes() {
  if (!state.recipes.length) {
    savedRecipesWrap.innerHTML = '<p class="empty">No full recipes saved yet.</p>';
    return;
  }

  savedRecipesWrap.innerHTML = `
    <h3>Saved Full Recipes</h3>
    <table>
      <thead>
        <tr>
          <th>Recipe</th>
          <th>Ingredients</th>
          <th>Created</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${[...state.recipes]
          .reverse()
          .map(
            (recipe) => `
            <tr>
              <td>${recipe.name}</td>
              <td>${recipe.items.length}</td>
              <td>${new Date(recipe.createdAt).toLocaleString()}</td>
              <td>
                <button type="button" data-load-recipe="${recipe.id}">Load</button>
                <button class="btn-danger" type="button" data-remove-recipe="${recipe.id}">Remove</button>
              </td>
            </tr>
          `,
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function renderSizeBreakdown() {
  if (!state.draftRecipeItems.length) {
    sizeBreakdownWrap.innerHTML = '<p class="empty">Add draft ingredients to see size-based costs and suggested prices.</p>';
    return;
  }

  const totals = state.draftRecipeItems.reduce(
    (sum, item) => {
      const ingredient = state.ingredients.find((ing) => ing.key === item.ingredientKey);
      const cost = ingredient ? ingredient.price : 0;

      return {
        small: sum.small + item.qtySmall * cost,
        medium: sum.medium + item.qtyMedium * cost,
        large: sum.large + item.qtyLarge * cost,
      };
    },
    { small: 0, medium: 0, large: 0 },
  );

  const foodCostRatio = state.config.foodCostPercent / 100;
  const sizes = [
    { name: "Small", cost: totals.small },
    { name: "Medium", cost: totals.medium },
    { name: "Large", cost: totals.large },
  ];

  sizeBreakdownWrap.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Size</th>
          <th>Food Cost</th>
          <th>Suggested Price @ ${state.config.foodCostPercent.toFixed(1)}%</th>
        </tr>
      </thead>
      <tbody>
        ${sizes
          .map((size) => {
            const suggestedPrice = foodCostRatio > 0 ? size.cost / foodCostRatio : 0;
            return `
              <tr>
                <td>${size.name}</td>
                <td>$${size.cost.toFixed(2)}</td>
                <td>$${suggestedPrice.toFixed(2)}</td>
              </tr>
            `;
          })
          .join("")}
      </tbody>
    </table>
  `;
}

function persist(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

renderAll();
