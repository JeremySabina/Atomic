const state = {
  ingredients: load("ingredients", []),
  recipeItems: load("recipeItems", []),
  config: load("sizeConfig", {
    small: 0.8,
    medium: 1,
    large: 1.25,
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
const recipeQtyInput = document.getElementById("recipe-qty");
const recipeTableWrap = document.getElementById("recipe-table-wrap");

const smallMultiplierInput = document.getElementById("small-multiplier");
const mediumMultiplierInput = document.getElementById("medium-multiplier");
const largeMultiplierInput = document.getElementById("large-multiplier");
const foodCostPercentInput = document.getElementById("food-cost-percent");
const sizeBreakdownWrap = document.getElementById("size-breakdown-wrap");

recipeNameInput.value = load("recipeName", "");
smallMultiplierInput.value = state.config.small;
mediumMultiplierInput.value = state.config.medium;
largeMultiplierInput.value = state.config.large;
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
    state.ingredients.push({
      key: normalizedName,
      name,
      unit,
      price,
    });
  }

  ingredientForm.reset();
  persist("ingredients", state.ingredients);
  renderAll();
});

recipeItemForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const ingredientKey = recipeIngredientSelect.value;
  const quantity = Number(recipeQtyInput.value);

  if (!ingredientKey || Number.isNaN(quantity) || quantity <= 0) return;

  const ingredient = state.ingredients.find((item) => item.key === ingredientKey);
  if (!ingredient) return;

  state.recipeItems.push({
    ingredientKey,
    ingredientName: ingredient.name,
    quantity,
    unit: ingredient.unit,
  });

  persist("recipeItems", state.recipeItems);
  recipeItemForm.reset();
  renderAll();
});

recipeNameInput.addEventListener("input", () => {
  persist("recipeName", recipeNameInput.value);
});

[smallMultiplierInput, mediumMultiplierInput, largeMultiplierInput, foodCostPercentInput].forEach(
  (input) => {
    input.addEventListener("input", () => {
      state.config = {
        small: Math.max(0, Number(smallMultiplierInput.value) || 0),
        medium: Math.max(0, Number(mediumMultiplierInput.value) || 0),
        large: Math.max(0, Number(largeMultiplierInput.value) || 0),
        foodCostPercent: Math.max(0.1, Number(foodCostPercentInput.value) || 0.1),
      };
      persist("sizeConfig", state.config);
      renderSizeBreakdown();
    });
  }
);

function renderAll() {
  renderIngredientSelect();
  renderIngredientTable();
  renderRecipeTable();
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
    state.ingredients
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
        </tr>
      </thead>
      <tbody>
        ${state.ingredients
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(
            (item) => `
            <tr>
              <td>${item.name}</td>
              <td>${item.unit}</td>
              <td>$${item.price.toFixed(2)}</td>
            </tr>
          `
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function renderRecipeTable() {
  if (!state.recipeItems.length) {
    recipeTableWrap.innerHTML = '<p class="empty">No recipe items yet.</p>';
    return;
  }

  const withCosts = state.recipeItems.map((item) => {
    const ingredient = state.ingredients.find((ing) => ing.key === item.ingredientKey);
    const unitCost = ingredient ? ingredient.price : 0;
    return {
      ...item,
      ingredientName: ingredient ? ingredient.name : item.ingredientName,
      unit: ingredient ? ingredient.unit : item.unit,
      unitCost,
      total: unitCost * item.quantity,
    };
  });

  const totalRecipeCost = withCosts.reduce((sum, item) => sum + item.total, 0);

  recipeTableWrap.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Ingredient</th>
          <th>Qty</th>
          <th>Unit</th>
          <th>Unit Cost</th>
          <th>Line Total</th>
        </tr>
      </thead>
      <tbody>
        ${withCosts
          .map(
            (item) => `
            <tr>
              <td>${item.ingredientName}</td>
              <td>${item.quantity.toFixed(2)}</td>
              <td>${item.unit}</td>
              <td>$${item.unitCost.toFixed(2)}</td>
              <td>$${item.total.toFixed(2)}</td>
            </tr>
          `
          )
          .join("")}
      </tbody>
    </table>
    <div class="kpi">
      <div><span>Recipe Name</span><strong>${recipeNameInput.value.trim() || "Untitled Recipe"}</strong></div>
      <div><span>Total Recipe Cost</span><strong>$${totalRecipeCost.toFixed(2)}</strong></div>
      <div><span>Ingredient Count</span><strong>${withCosts.length}</strong></div>
    </div>
  `;
}

function renderSizeBreakdown() {
  if (!state.recipeItems.length) {
    sizeBreakdownWrap.innerHTML = '<p class="empty">Add recipe items to see a size cost breakdown.</p>';
    return;
  }

  const baseCost = state.recipeItems.reduce((sum, item) => {
    const ingredient = state.ingredients.find((ing) => ing.key === item.ingredientKey);
    return sum + (ingredient ? ingredient.price : 0) * item.quantity;
  }, 0);

  const sizes = [
    { name: "Small", factor: state.config.small },
    { name: "Medium", factor: state.config.medium },
    { name: "Large", factor: state.config.large },
  ];

  const foodCostRatio = state.config.foodCostPercent / 100;

  sizeBreakdownWrap.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Size</th>
          <th>Multiplier</th>
          <th>Food Cost</th>
          <th>Suggested Price @ ${state.config.foodCostPercent.toFixed(1)}%</th>
        </tr>
      </thead>
      <tbody>
        ${sizes
          .map((size) => {
            const cost = baseCost * size.factor;
            const suggestedPrice = foodCostRatio > 0 ? cost / foodCostRatio : 0;
            return `
              <tr>
                <td>${size.name}</td>
                <td>${size.factor.toFixed(2)}x</td>
                <td>$${cost.toFixed(2)}</td>
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
