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
let savedItems = [];
let itemStorageKey = "";
let draggedItem = null;

try {
  const storedLists = JSON.parse(localStorage.getItem(storageKey) || "[]");
  if (Array.isArray(storedLists)) {
    savedLists = storedLists.filter((name) => typeof name === "string");
  }
} catch {
  savedLists = [];
}

function syncItemsFromDom() {
  if (!itemList || !itemStorageKey) return;

  const orderedItems = Array.from(itemList.children).map((element) => element.textContent.trim());
  const filteredItems = orderedItems.filter((name) => name);
  savedItems = filteredItems;
  localStorage.setItem(itemStorageKey, JSON.stringify(savedItems));
}

function attachDragHandlers(itemElement) {
  itemElement.setAttribute("draggable", "true");

  itemElement.addEventListener("dragstart", function (event) {
    draggedItem = this;
    this.classList.add("dragging");
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", this.textContent);
    }
  });

  itemElement.addEventListener("dragend", function () {
    this.classList.remove("dragging");
    draggedItem = null;
  });

  itemElement.addEventListener("dragover", function (event) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "move";
    }
  });

  itemElement.addEventListener("drop", function (event) {
    event.preventDefault();
    if (!draggedItem || draggedItem === this || !itemList) {
      return;
    }

    const draggedIndex = Array.from(itemList.children).indexOf(draggedItem);
    const targetIndex = Array.from(itemList.children).indexOf(this);

    if (draggedIndex < targetIndex) {
      itemList.insertBefore(draggedItem, this.nextSibling);
    } else {
      itemList.insertBefore(draggedItem, this);
    }

    syncItemsFromDom();
  });
}

function createItemElement(itemName) {
  const itemElement = document.createElement("li");
  itemElement.className = "item";
  itemElement.textContent = itemName;
  attachDragHandlers(itemElement);
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
  itemStorageKey = `items:${listName}`;

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