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
let dragHandle = null;
let activePointerId = null;

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

  savedItems = Array.from(itemList.querySelectorAll(".item__name"))
    .map((element) => element.textContent.trim())
    .filter(Boolean);
  localStorage.setItem(itemStorageKey, JSON.stringify(savedItems));
}

function getDragAfterElement(container, pointerY) {
  const items = Array.from(container.querySelectorAll(".item:not(.dragging)"));

  return items.reduce((closest, item) => {
    const bounds = item.getBoundingClientRect();
    const offset = pointerY - bounds.top - bounds.height / 2;

    if (offset < 0 && offset > closest.offset) {
      return { offset, element: item };
    }

    return closest;
  }, { offset: Number.NEGATIVE_INFINITY, element: null }).element;
}

function finishItemDrag(event) {
  if (!draggedItem || event.pointerId !== activePointerId) return;

  draggedItem.classList.remove("dragging");
  syncItemsFromDom();

  const pointerId = activePointerId;
  draggedItem = null;
  dragHandle = null;
  activePointerId = null;

  if (itemList.hasPointerCapture(pointerId)) {
    itemList.releasePointerCapture(pointerId);
  }
}

function createItemElement(itemName) {
  const itemElement = document.createElement("li");
  itemElement.className = "item inside-list-item-border";

  const name = document.createElement("span");
  name.className = "item__name";
  name.textContent = itemName;

  const handle = document.createElement("span");
  handle.className = "drag-handle";
  handle.setAttribute("aria-hidden", "true");
  handle.textContent = "☰";

  itemElement.append(name, handle);
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
const topicInput = document.getElementById("topic");
const addTopicButton = document.getElementById("add-topic-button");
const topicList = document.getElementById("topic-list");

topicInput.addEventListener("keypress", function (event) {
  if (event.key === "Enter") {
    addTopicButton.click();
  }
});

addTopicButton.addEventListener("click", function () {
  const topicName = topicInput.value.trim();
  if (!topicName) {
    topicInput.focus();
    return;
  }

  const topicElement = document.createElement("h3"); //надо чтобы они были отдельными элементами, а не списком, так как это заголовки
  topicElement.className = "topic";
  topicElement.textContent = topicName;
  topicList.append(topicElement);

  topicInput.value = "";
  topicInput.focus();
});

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

  itemList.addEventListener("pointerdown", (event) => {
    const handle = event.target.closest(".drag-handle");
    if (!handle || !itemList.contains(handle) || !event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) {
      return;
    }

    draggedItem = handle.closest(".item");
    if (!draggedItem) return;

    dragHandle = handle;
    activePointerId = event.pointerId;
    itemList.setPointerCapture(event.pointerId);
    draggedItem.classList.add("dragging");
    event.preventDefault();
  });

  itemList.addEventListener("pointermove", (event) => {
    if (!draggedItem || event.pointerId !== activePointerId) return;

    event.preventDefault();
    const afterElement = getDragAfterElement(itemList, event.clientY);
    if (afterElement) {
      itemList.insertBefore(draggedItem, afterElement);
    } else {
      itemList.append(draggedItem);
    }
  });

  itemList.addEventListener("pointerup", finishItemDrag);
  itemList.addEventListener("pointercancel", finishItemDrag);
  itemList.addEventListener("lostpointercapture", finishItemDrag);

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
const list = document.getElementById('sortable-list');
if (list) {
let draggingItem = null;
let nextItem = null;

// Функція, яка визначає, над яким елементом зараз знаходиться палець/мишка
function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.list-item:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// 1. Коли ми натиснули (або затиснули пальцем)
list.addEventListener('pointerdown', (e) => {
    // Шукаємо, чи натиснули ми саме на ручку (drag-handle)
    const handle = e.target.closest('.drag-handle');
    if (!handle) return; // Якщо ні, ігноруємо

    // Знаходимо батьківський елемент списку
    draggingItem = handle.closest('.list-item');
    if (!draggingItem) return;

    // Захоплюємо pointer, щоб події pointermove спрацьовували, навіть якщо палець вийде за межі елемента
    e.target.setPointerCapture(e.pointerId);
    
    // Додаємо клас для візуального ефекту (стає напівпрозорим)
    // setTimeout потрібен, щоб браузер встиг відрендерити стан ДО початку руху
    setTimeout(() => {
        draggingItem.classList.add('dragging');
    }, 0);
});

// 2. Коли ми рухаємо пальцем/мишкою
list.addEventListener('pointermove', (e) => {
    if (!draggingItem) return; // Якщо нічого не тагнемо, виходимо
    
    e.preventDefault(); // Запобігаємо скролу сторінки на телефоні!

    // Знаходимо елемент, після якого треба вставити той, що тагнемо
    const afterElement = getDragAfterElement(list, e.clientY);
    
    if (afterElement == null) {
        // Якщо ми в самому низу списку
        list.appendChild(draggingItem);
    } else {
        // Вставляємо перед знайденим елементом
        list.insertBefore(draggingItem, afterElement);
    }
});

// 3. Коли ми відпустили палець/мишку
list.addEventListener('pointerup', (e) => {
    if (!draggingItem) return;
    
    // Відпускаємо pointer
    e.target.releasePointerCapture(e.pointerId);
    
    // Прибираємо клас для візуального ефекту
    draggingItem.classList.remove('dragging');
    draggingItem = null;
});

// Також обробляємо відміну pointer (наприклад, якщо тач перервався дзвінком)
list.addEventListener('pointercancel', (e) => {
    if (!draggingItem) return;
    e.target.releasePointerCapture(e.pointerId);
    draggingItem.classList.remove('dragging');
    draggingItem = null;
});
}