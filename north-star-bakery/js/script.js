/* =========================================================
   North Star Bakery - JavaScript
   1. Pre-order planner (products.html): filter products by
      category and build a pre-order list.
   2. Form validation (contact.html).
   3. Browser storage with localStorage:
        - the pre-order list (saved across pages and visits)
        - the last category the user picked
        - the customer's name and email (pre-fills the form)
   ========================================================= */

// ---------- DATA (arrays and objects) ----------

// Keys used to save data in localStorage, kept in one object
// so the same names are used everywhere in the file.
const STORAGE_KEYS = {
  list: "northStar.preorderList",
  category: "northStar.lastCategory",
  customer: "northStar.customer"
};

// Array of category names used to build the filter buttons.
const CATEGORIES = ["All", "Breads", "Pastries", "Cakes"];

// Array of product objects. Each object describes one item.
const PRODUCTS = [
  { id: "sourdough",   name: "Signature Sourdough Loaf",   category: "Breads",   price: 9,    unit: "loaf",  description: "Our 24-hour sourdough with a crackly crust." },
  { id: "wheat",       name: "Honey Whole Wheat",          category: "Breads",   price: 7,    unit: "loaf",  description: "Soft sandwich bread made with local honey." },
  { id: "baguette",    name: "French Baguette",            category: "Breads",   price: 4,    unit: "each",  description: "Thin, crisp crust and an airy middle." },
  { id: "croissant",   name: "Butter Croissant",           category: "Pastries", price: 3.75, unit: "each",  description: "Flaky layers made with real butter." },
  { id: "cinnamon",    name: "Cinnamon Roll",              category: "Pastries", price: 4.5,  unit: "each",  description: "Topped with vanilla cream cheese icing." },
  { id: "cookies",     name: "Brown Butter Cookies (6)",   category: "Pastries", price: 13,   unit: "box",   description: "This week's featured item, by the half dozen." },
  { id: "birthday",    name: "Classic Birthday Cake (8 in)", category: "Cakes",  price: 38,   unit: "cake",  description: "Vanilla or chocolate layers. Order 3 days ahead." },
  { id: "carrot",      name: "Carrot Cake (9 in)",         category: "Cakes",    price: 45,   unit: "cake",  description: "Spiced layers with cream cheese frosting." }
];

// Messages shown under form fields when something is wrong.
const ERROR_MESSAGES = {
  nameRequired: "Please enter your name.",
  nameLength: "Your name must be between 2 and 50 characters.",
  emailRequired: "Please enter your email so we can confirm your order.",
  emailFormat: "Please enter a valid email address, like name@example.com.",
  requestTypeRequired: "Please choose a request type.",
  dateRequired: "Please choose a pickup date for your order.",
  dateRange: "Please choose a pickup date between tomorrow and 30 days from today.",
  dateMonday: "We are closed on Mondays. Please choose a different pickup date.",
  detailsRequired: "Please list the items you want (at least 10 characters).",
  allergyLength: "Allergy notes must be 200 characters or fewer."
};

// The user's current pre-order list. Each entry is an object
// like { id: "croissant", qty: 2 }. It is loaded from storage.
let preorderList = [];


// ---------- STORAGE HELPERS ----------

// Read a value from localStorage and turn it back into data.
// Returns the fallback if nothing is saved or storage is blocked.
function loadFromStorage(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (error) {
    return fallback;
  }
}

// Save any value (array, object, or text) to localStorage as JSON.
function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // If storage is blocked (private mode), the site still works
    // for this visit; the data just is not remembered.
  }
}

// Save the current pre-order list and update the count in the nav.
function saveList() {
  saveToStorage(STORAGE_KEYS.list, preorderList);
  updateListCount();
}


// ---------- SHARED (every page) ----------

// Show the number of items in the pre-order list in the nav on every page.
function updateListCount() {
  const total = preorderList.reduce(function (sum, entry) {
    return sum + entry.qty;
  }, 0);
  document.querySelectorAll("[data-list-count]").forEach(function (badge) {
    badge.textContent = total;
  });
}

// Find a product object in the PRODUCTS array by its id.
function findProduct(id) {
  return PRODUCTS.find(function (product) {
    return product.id === id;
  });
}

// Format a number as dollars, like 3.5 -> "$3.50".
function formatPrice(amount) {
  return "$" + amount.toFixed(2);
}

// On the home page, greet returning customers by name.
function showWelcomeBack() {
  const message = document.getElementById("welcome-back");
  if (!message) return;
  const customer = loadFromStorage(STORAGE_KEYS.customer, null);
  if (customer && customer.name) {
    const firstName = customer.name.split(" ")[0];
    const count = document.querySelector("[data-list-count]").textContent;
    message.textContent = "Welcome back, " + firstName + "!" +
      (count !== "0" ? " You have " + count + " item(s) saved in your pre-order list." : "");
    message.hidden = false;
  }
}


// ---------- FEATURE: PRE-ORDER PLANNER (products.html) ----------

// Create one filter button for each category in the CATEGORIES array.
function renderFilterButtons(activeCategory) {
  const container = document.getElementById("filter-buttons");
  container.innerHTML = "";
  CATEGORIES.forEach(function (category) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "filter-button";
    button.textContent = category;
    button.setAttribute("aria-pressed", category === activeCategory ? "true" : "false");
    button.addEventListener("click", function () {
      selectCategory(category);
    });
    container.appendChild(button);
  });
}

// Run when a filter button is clicked: remember the choice and redraw.
function selectCategory(category) {
  saveToStorage(STORAGE_KEYS.category, category);
  renderFilterButtons(category);
  renderProducts(category);
}

// Show only the products that match the chosen category.
function renderProducts(category) {
  const grid = document.getElementById("product-grid");
  const note = document.getElementById("results-note");
  const matches = PRODUCTS.filter(function (product) {
    return category === "All" || product.category === category;
  });

  grid.innerHTML = "";
  matches.forEach(function (product) {
    grid.appendChild(createProductCard(product));
  });
  note.textContent = "Showing " + matches.length + " " +
    (category === "All" ? "items" : category.toLowerCase()) + ".";
}

// Build the HTML for one product card.
function createProductCard(product) {
  const item = document.createElement("li");
  item.className = "product-card";

  const title = document.createElement("h3");
  title.textContent = product.name;

  const description = document.createElement("p");
  description.textContent = product.description;

  const meta = document.createElement("p");
  meta.className = "product-meta";
  meta.textContent = product.category + " | " + formatPrice(product.price) + " per " + product.unit;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "button";
  button.textContent = "Add to list";
  button.setAttribute("aria-label", "Add " + product.name + " to my pre-order list");
  button.addEventListener("click", function () {
    addToList(product.id);
  });

  item.append(title, description, meta, button);

  // If the item is already in the list, say how many.
  const entry = preorderList.find(function (e) { return e.id === product.id; });
  if (entry) {
    const inList = document.createElement("p");
    inList.className = "in-list-note";
    inList.textContent = "In your list: " + entry.qty;
    item.appendChild(inList);
  }
  return item;
}

// Add one of a product to the list (or increase its quantity).
function addToList(productId) {
  const entry = preorderList.find(function (e) { return e.id === productId; });
  if (entry) {
    entry.qty = entry.qty + 1;
  } else {
    preorderList.push({ id: productId, qty: 1 });
  }
  saveList();
  refreshPlanner();
}

// Change the quantity of an item by +1 or -1. Remove it at 0.
function changeQuantity(productId, change) {
  const entry = preorderList.find(function (e) { return e.id === productId; });
  if (!entry) return;
  entry.qty = entry.qty + change;
  if (entry.qty <= 0) {
    removeFromList(productId);
    return;
  }
  saveList();
  refreshPlanner();
}

// Remove an item from the list completely.
function removeFromList(productId) {
  preorderList = preorderList.filter(function (e) { return e.id !== productId; });
  saveList();
  refreshPlanner();
}

// Empty the whole list.
function clearList() {
  preorderList = [];
  saveList();
  refreshPlanner();
}

// Draw the "My Pre-Order List" panel and the estimated total.
function renderOrderList() {
  const list = document.getElementById("order-list");
  const empty = document.getElementById("empty-message");
  const totalText = document.getElementById("order-total");
  const sendLink = document.getElementById("send-list");

  list.innerHTML = "";
  let total = 0;

  preorderList.forEach(function (entry) {
    const product = findProduct(entry.id);
    if (!product) return;
    total = total + product.price * entry.qty;

    const row = document.createElement("li");
    row.className = "order-item";

    const label = document.createElement("span");
    label.textContent = product.name;

    const controls = document.createElement("span");
    controls.className = "qty-controls";
    controls.append(
      makeQtyButton("−", "Remove one " + product.name, function () { changeQuantity(entry.id, -1); }),
      document.createTextNode(" " + entry.qty + " "),
      makeQtyButton("+", "Add one " + product.name, function () { changeQuantity(entry.id, 1); })
    );

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove-button";
    remove.textContent = "Remove";
    remove.setAttribute("aria-label", "Remove " + product.name + " from my list");
    remove.addEventListener("click", function () { removeFromList(entry.id); });

    row.append(label, controls, remove);
    list.appendChild(row);
  });

  const isEmpty = preorderList.length === 0;
  empty.hidden = !isEmpty;
  totalText.textContent = isEmpty ? "" : "Estimated total: " + formatPrice(total) + " (final price confirmed by email)";
  sendLink.setAttribute("aria-disabled", isEmpty ? "true" : "false");
}

// Small helper that makes a + or - button.
function makeQtyButton(symbol, label, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "qty-button";
  button.textContent = symbol;
  button.setAttribute("aria-label", label);
  button.addEventListener("click", onClick);
  return button;
}

// Redraw both the product cards and the list panel.
function refreshPlanner() {
  const category = loadFromStorage(STORAGE_KEYS.category, "All");
  renderProducts(category);
  renderOrderList();
}

// Set up the planner when products.html loads.
function initPlanner() {
  if (!document.getElementById("product-grid")) return;

  // Restore the last category the user picked (default "All").
  let category = loadFromStorage(STORAGE_KEYS.category, "All");
  if (!CATEGORIES.includes(category)) category = "All";

  renderFilterButtons(category);
  renderProducts(category);
  renderOrderList();

  document.getElementById("clear-list").addEventListener("click", clearList);
  document.getElementById("send-list").addEventListener("click", function (event) {
    if (preorderList.length === 0) {
      event.preventDefault();
      document.getElementById("empty-message").textContent =
        "Add at least one item before sending your list.";
    }
  });
}


// ---------- FORM VALIDATION (contact.html) ----------

// Show an error message under a field and mark the field invalid.
function showError(fieldId, message) {
  const field = document.getElementById(fieldId);
  const error = document.getElementById(fieldId + "-error");
  field.setAttribute("aria-invalid", "true");
  error.textContent = message;
}

// Remove the error message from a field.
function clearError(fieldId) {
  const field = document.getElementById(fieldId);
  const error = document.getElementById(fieldId + "-error");
  field.removeAttribute("aria-invalid");
  error.textContent = "";
}

// Check an email address with a simple pattern: text@text.text
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

// Turn a date input value like "2026-10-30" into a local date.
// (new Date("2026-10-30") would treat it as midnight UTC, which is
// the evening BEFORE in U.S. time zones, so we build it from parts.)
function parseLocalDate(value) {
  const parts = value.split("-");
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

// Check the pickup date: must be from tomorrow up to 30 days ahead,
// and not a Monday. Returns an error message, or "" if it is fine.
function checkPickupDate(value) {
  const chosen = parseLocalDate(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const latest = new Date(today);
  latest.setDate(today.getDate() + 30);

  if (chosen < tomorrow || chosen > latest) return ERROR_MESSAGES.dateRange;
  if (chosen.getDay() === 1) return ERROR_MESSAGES.dateMonday;
  return "";
}

// Check every field. Returns true if the whole form is valid.
function validateForm() {
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const requestType = document.getElementById("requestType").value;
  const pickupDate = document.getElementById("pickupDate").value;
  const details = document.getElementById("itemDetails").value.trim();
  const allergies = document.getElementById("allergyNotes").value.trim();
  const isOrder = requestType !== "" && requestType !== "question";
  let isValid = true;

  // 1. Name: required, 2 to 50 characters
  if (name === "") {
    showError("name", ERROR_MESSAGES.nameRequired); isValid = false;
  } else if (name.length < 2 || name.length > 50) {
    showError("name", ERROR_MESSAGES.nameLength); isValid = false;
  } else { clearError("name"); }

  // 2. Email: required and must match the email pattern
  if (email === "") {
    showError("email", ERROR_MESSAGES.emailRequired); isValid = false;
  } else if (!isValidEmail(email)) {
    showError("email", ERROR_MESSAGES.emailFormat); isValid = false;
  } else { clearError("email"); }

  // 3. Request type: required
  if (requestType === "") {
    showError("requestType", ERROR_MESSAGES.requestTypeRequired); isValid = false;
  } else { clearError("requestType"); }

  // 4. Pickup date: required for orders, must be in the allowed range
  if (isOrder && pickupDate === "") {
    showError("pickupDate", ERROR_MESSAGES.dateRequired); isValid = false;
  } else if (pickupDate !== "" && checkPickupDate(pickupDate) !== "") {
    showError("pickupDate", checkPickupDate(pickupDate)); isValid = false;
  } else { clearError("pickupDate"); }

  // 5. Item details: at least 10 characters for orders
  if (isOrder && details.length < 10) {
    showError("itemDetails", ERROR_MESSAGES.detailsRequired); isValid = false;
  } else { clearError("itemDetails"); }

  // 6. Allergy notes: optional, but 200 characters maximum
  if (allergies.length > 200) {
    showError("allergyNotes", ERROR_MESSAGES.allergyLength); isValid = false;
  } else { clearError("allergyNotes"); }

  return isValid;
}

// Turn the saved pre-order list into text for the Item details box.
function listToText() {
  return preorderList.map(function (entry) {
    const product = findProduct(entry.id);
    return product ? entry.qty + " x " + product.name : "";
  }).filter(Boolean).join("\n");
}

// Fill in the form with saved data when contact.html opens.
function prefillForm() {
  const customer = loadFromStorage(STORAGE_KEYS.customer, null);
  if (customer) {
    document.getElementById("name").value = customer.name || "";
    document.getElementById("email").value = customer.email || "";
  }
  if (preorderList.length > 0) {
    document.getElementById("itemDetails").value = listToText();
    document.getElementById("requestType").value = "preorder";
  }
}

// Keep the allergy character counter up to date.
function updateAllergyCount() {
  const length = document.getElementById("allergyNotes").value.length;
  document.getElementById("allergy-count").textContent = length + " / 200 characters";
}

// Run when the form is submitted.
function handleSubmit(event) {
  event.preventDefault(); // stop the page from reloading / sending

  if (!validateForm()) {
    // Move the cursor to the first field with a problem.
    const firstInvalid = document.querySelector("[aria-invalid='true']");
    if (firstInvalid) firstInvalid.focus();
    return;
  }

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();

  // Remember the customer's name and email if they checked the box.
  if (document.getElementById("rememberMe").checked) {
    saveToStorage(STORAGE_KEYS.customer, { name: name, email: email });
  } else {
    localStorage.removeItem(STORAGE_KEYS.customer);
  }

  // Show a confirmation, then clear the order details and the saved list.
  const success = document.getElementById("form-success");
  success.textContent = "Thank you, " + name.split(" ")[0] +
    "! Your request was received. We will email " + email + " within one business day.";
  success.hidden = false;

  ["requestType", "pickupDate", "itemDetails", "allergyNotes"].forEach(function (id) {
    document.getElementById(id).value = "";
  });
  updateAllergyCount();
  preorderList = [];
  saveList();
  success.scrollIntoView({ behavior: "smooth", block: "center" });
}

// Set up the form when contact.html loads.
function initForm() {
  const form = document.getElementById("order-form");
  if (!form) return;

  prefillForm();
  updateAllergyCount();
  form.addEventListener("submit", handleSubmit);

  // Clear a field's error as soon as the user fixes it.
  form.querySelectorAll("input, select, textarea").forEach(function (field) {
    field.addEventListener("input", function () {
      if (field.getAttribute("aria-invalid") === "true") clearError(field.id);
      if (field.id === "allergyNotes") updateAllergyCount();
    });
  });
}


// ---------- START ----------
// Load the saved list, then set up whatever is on this page.
function init() {
  preorderList = loadFromStorage(STORAGE_KEYS.list, []);
  updateListCount();
  showWelcomeBack();
  initPlanner();
  initForm();
}

document.addEventListener("DOMContentLoaded", init);
