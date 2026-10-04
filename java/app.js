const listNameInput = document.getElementById("list_name");
const createListButton = document.getElementById("create-list-button");
const listsContainer = document.getElementById("lists");
const storageKey = "lists";

function addList(listName) {
  const listItem = document.createElement("li");
  const listLink = document.createElement("a");
  listLink.className = "list-card";
  listLink.href = `inside_list.html?list=${encodeURIComponent(listName)}`;

  const title = document.createElement("span");
  title.className = "list-card__title";
  title.textContent = listName;

  const arrow = document.createElement("span");
  arrow.className = "list-card__arrow";
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = "→";

  listLink.append(title, arrow);
  listItem.append(listLink);
  listsContainer.append(listItem);
}

let savedLists = [];
try {
  const storedLists = JSON.parse(localStorage.getItem(storageKey) || "[]");
  if (Array.isArray(storedLists)) {
    savedLists = storedLists.filter((name) => typeof name === "string");
  }
} catch {
  savedLists = [];
}

function createItemElement(itemName) {
  const itemElement = document.createElement("li");
  itemElement.className = "item";
  itemElement.textContent = itemName;
  return itemElement;
}

if (listsContainer && createListButton && listNameInput) {
  savedLists.forEach(addList);

  createListButton.addEventListener("click", function () {
    const listName = listNameInput.value.trim();

    if (!listName) {
      listNameInput.focus();
      return;
    }

    addList(listName);
    savedLists.push(listName);
    localStorage.setItem(storageKey, JSON.stringify(savedLists));

    listNameInput.value = "";
    listNameInput.focus();
  });
}

const itemInput = document.getElementById("item-input");
const addItemButton = document.getElementById("add-item-button");
const itemList = document.getElementById("item-list");
const listTitle = document.getElementById("list-title");

if (itemInput && addItemButton && itemList && listTitle) {
  const listName = new URLSearchParams(window.location.search).get("list") || "Список";
  const itemStorageKey = `items:${listName}`;
  let savedItems = [];

  listTitle.textContent = listName;
  document.title = listName;

  try {
    const storedItems = JSON.parse(localStorage.getItem(itemStorageKey) || "[]");
    if (Array.isArray(storedItems)) {
      savedItems = storedItems.filter((item) => typeof item === "string");
    }
  } catch {
    savedItems = [];
  }

  savedItems.forEach((itemName) => itemList.append(createItemElement(itemName)));

  addItemButton.addEventListener("click", function () {
    const itemName = itemInput.value.trim();
    if (!itemName) {
      itemInput.focus();
      return;
    }

    savedItems.push(itemName);
    localStorage.setItem(itemStorageKey, JSON.stringify(savedItems));
    itemList.append(createItemElement(itemName));
    itemInput.value = "";
    itemInput.focus();
  });
}
