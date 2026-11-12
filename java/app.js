const listNameInput = document.getElementById("list_name");
const createListButton = document.getElementById("create-list-button");
const listsContainer = document.getElementById("lists");

const topicInput = document.getElementById("inside-list-topic-input");
const addTopicButton = document.getElementById("add-topic-button");
const topicList = document.getElementById("topic-list");
const showTopicInputButton = document.querySelector(".inside-list-show-topic-input-button");
const topicEditor = document.getElementById("topic-editor");
const itemList = topicList || document.getElementById("item-list");

const itemInput = document.getElementById("item-input");
const addItemButton = document.getElementById("add-item-button");
const showItemInputButton = document.querySelector(".inside-list-show-item-input-button");
const itemEditor = document.getElementById("item-editor");
const itemSearchInput = document.getElementById("item-search");
const itemSearchButton = document.getElementById("item-search-button");
const listTitle = document.getElementById("list-title");

// Ключи для хранения данных в localStorage
const listStorageKey = "lists";
const contentStorageKey = "content";
let savedItems = [];
let itemStorageKey = "";
let draggedItem = null;
let activePointerId = null;

// Функции для работы с localStorage
function readArray(key) {
  try {
    const storageKey = `${window.flowStoragePrefix || ""}${key}`;
    const value = JSON.parse(localStorage.getItem(storageKey) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

// Сохраняет массив в localStorage
function saveArray(key, values) {
  try {
    const storageKey = `${window.flowStoragePrefix || ""}${key}`;
    localStorage.setItem(storageKey, JSON.stringify(values));
  } catch {
    // Хранилище может быть недоступно.
  }
}
// Создаёт уникальный ID
function createId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return Date.now().toString(36) +
    Math.random().toString(36).slice(2);
}

// Получает списки и переносит старый формат в новый
function getLists() {
  const oldLists = readArray(listStorageKey);

  const newLists = oldLists.map((list) => {
    // Если список уже имеет ID, оставляем его
    if (
      list &&
      typeof list === "object" &&
      list.id &&
      typeof list.name === "string"
    ) {
      return list;
    }

    // Если раньше список был просто строкой,
    // создаём для него ID
    return {
      id: createId(),
      name: String(list)
    };
  });

  // Сохраняем новый формат
  saveArray(listStorageKey, newLists);

  return newLists;
}

// Получает имя текущего списка из параметров URL
function getCurrentListId() {
  const params = new URLSearchParams(window.location.search);

  return params.get("listId");
}

// Создает элемент списка с ссылкой на страницу внутри списка
function createListCard(name, id) {
  const listItem = document.createElement("li");

  const link = document.createElement("a");
  link.className = "list-card";
  link.href = `inside_list.html?listId=${encodeURIComponent(id)}`;

  const title = document.createElement("span");
  title.className = "list-card__title";
  title.textContent = name;

  const arrow = document.createElement("span");
  arrow.className = "list-card__arrow";
  arrow.textContent = "→";

  link.append(title, arrow);

  // Кнопка редактирования
  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.textContent = "✎";
  editButton.className = "edit-button";

  editButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    const newName = prompt("New name:", name);

    if (newName === null || !newName.trim()) return;

    const lists = getLists();

    const currentList = lists.find((list) => list.id === id);

    if (!currentList) return;

    currentList.name = newName.trim();

    saveArray(listStorageKey, lists);

    title.textContent = currentList.name;
  });

  listItem.append(link, editButton);

  return listItem;
}
// Загружает сохраненные списки и отображает их на странице
if (listsContainer) {
  const lists = getLists();

  lists.forEach((list) => {
    listsContainer.append(
      createListCard(list.name, list.id)
    );
  });
}
// Обработчик события для кнопки создания нового списка
if (listsContainer && createListButton && listNameInput) {
  createListButton.addEventListener("click", (event) => {
    event.preventDefault();

    const name = listNameInput.value.trim();

    if (!name) {
      listNameInput.focus();
      return;
    }

    const lists = getLists();

    const newList = {
      id: createId(),
      name: name
    };

    lists.push(newList);

    saveArray(listStorageKey, lists);

    listsContainer.append(
      createListCard(newList.name, newList.id)
    );

    listNameInput.value = "";
    listNameInput.focus();
  });
}

// Создает название группы (топика) внутри списка
// Создаём топик
function createTopic(name) {
  const topic = document.createElement("h3");
  topic.className = "topic";

  const title = document.createElement("span");
  title.className = "topic__name";
  title.textContent = name;

  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.className = "edit-button";
  editButton.textContent = "✎";

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "topic-delete-button";
  deleteButton.setAttribute("aria-label", "delete topic");
  deleteButton.textContent = "×";

  const handle = document.createElement("span");
  handle.className = "drag-handle";
  handle.textContent = "☰";
  topic.append(title, handle, editButton,  deleteButton);

  return topic;
}

// Создаём элемент
function createItem(name) {
  const item = document.createElement("div");
  item.className = "item inside-list-item-border";

  const itemName = document.createElement("span");
  itemName.className = "item__name";
  itemName.textContent = name;

  // Кнопка редактирования
  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.className = "edit-button";
  editButton.textContent = "✎";

  // Ручка для перетаскивания
  const handle = document.createElement("span");
  handle.className = "drag-handle";
  handle.textContent = "☰";

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "item-delete-button";
  deleteButton.setAttribute("aria-label", "Delete item");
  deleteButton.textContent = "×";


  item.append(itemName, handle, editButton,  deleteButton);

  return item;
}


// Определяем контейнер для контента (топики и элементы)
const contentContainer = topicList || document.getElementById("item-list");
//  для отображения и скрытия добавления топиков и элементов
if (showTopicInputButton && topicEditor) {
  showTopicInputButton.addEventListener("click", () => {
    topicEditor.hidden = false;
    showTopicInputButton.hidden = true;
    topicInput?.focus();
  });
}

//  для отображения и скрытия добавления элементов
if (contentContainer) {
  const listId = getCurrentListId();

  const lists = getLists();

  const currentList = lists.find(
    (list) => list.id === listId
  );

  const listName = currentList?.name || "List";

  const contentStorageKey = `content:${listId}`;
  let draggedElement = null;
  let activeContentPointerId = null;
// Функция для получения текущего контента (топики и элементы) в виде массива объектов
  function getContent() {
    return Array.from(contentContainer.children)
      .filter((element) =>
        element.classList.contains("topic") ||
        element.classList.contains("item")
      )
      .map((element) => ({
        type: element.classList.contains("topic") ? "topic" : "item",
        name: element.classList.contains("topic")
          ? element.querySelector(".topic__name")?.textContent.trim() || ""
          : element.querySelector(".item__name")?.textContent.trim() || ""
      }))
      .filter((entry) => entry.name);
  }
// Функция для фильтрации элементов по поисковому запросу
  let searchHighlightAnimation = null;

  function filterItems(shouldScrollToMatch = false) {
    const searchTerms = itemSearchInput?.value
      .trim()
      .toLocaleLowerCase()
      .split(/\s+/)
      .filter(Boolean) || [];
    const searchTerm = searchTerms.join(" ");
    let firstMatch = null;
    let exactMatch = null;

    contentContainer.querySelectorAll(".item").forEach((item) => {
      const nameElement = item.querySelector(".item__name");
      if (!nameElement) return;

      const originalName = nameElement.textContent.trim();
      const normalizedName = originalName.toLocaleLowerCase();
      const matchingTerms = searchTerms.filter((term) => normalizedName.includes(term));
      item.hidden = searchTerms.length > 0 && matchingTerms.length === 0;
      renderItemSearchMatches(nameElement, originalName, matchingTerms);

      if (!item.hidden && !firstMatch) {
        firstMatch = item;
      }

      if (normalizedName === searchTerm) {
        exactMatch = item;
      }
    });

    if (!shouldScrollToMatch) return;

    searchHighlightAnimation?.cancel();

    const matchToShow = exactMatch || firstMatch;

    if (!searchTerm || !matchToShow) return;

    matchToShow.scrollIntoView({ behavior: "smooth", block: "center" });
    searchHighlightAnimation = matchToShow.animate(
      [
        { backgroundColor: "#ffeb3b", boxShadow: "0 0 0 4px #ffeb3b" },
        {
          backgroundColor: getComputedStyle(matchToShow).backgroundColor,
          boxShadow: "0 0 0 0 transparent"
        }
      ],
      { duration: 1000, easing: "ease-out" }
    );
  }

  function renderItemSearchMatches(nameElement, name, matchingTerms) {
    if (matchingTerms.length === 0) {
      nameElement.textContent = name;
      return;
    }

    const escapedTerms = matchingTerms
      .sort((a, b) => b.length - a.length)
      .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const matcher = new RegExp(escapedTerms.join("|"), "gi");
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;

    for (const match of name.matchAll(matcher)) {
      const matchIndex = match.index;
      fragment.append(document.createTextNode(name.slice(lastIndex, matchIndex)));

      const highlightedText = document.createElement("mark");
      highlightedText.textContent = match[0];
      fragment.append(highlightedText);
      lastIndex = matchIndex + match[0].length;
    }

    fragment.append(document.createTextNode(name.slice(lastIndex)));
    nameElement.replaceChildren(fragment);
  }

  itemSearchButton?.addEventListener("click", () => filterItems(true));

// Функция для сохранения текущего контента в localStorage
  function saveContent() {
    saveArray(contentStorageKey, getContent());
    filterItems();
  }

  contentContainer.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const deleteButton = target?.closest(".item-delete-button");
    const item = deleteButton?.closest(".item");

    if (!item || !contentContainer.contains(item)) return;

    item.remove();
    saveContent();
  });
    contentContainer.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const deleteButton = target?.closest(".topic-delete-button");
    const item = deleteButton?.closest(".topic");

    if (!item || !contentContainer.contains(item)) return;

    item.remove();
    saveContent();
  });
// Редактирование прямо в строке
    contentContainer.addEventListener("click", (event) => {
      const target = event.target;

      if (!(target instanceof Element)) return;

      const editButton = target.closest(".edit-button");

      if (!editButton) return;

      const element = editButton.closest(".topic, .item");

      if (!element) return;

      const nameElement = element.classList.contains("topic")
        ? element.querySelector(".topic__name")
        : element.querySelector(".item__name");

      if (!nameElement) return;

      // Не открываем повторное редактирование
      if (element.querySelector(".edit-input")) return;

      const oldName = nameElement.textContent;

      // Создаём поле ввода
      const input = document.createElement("input");
      input.type = "text";
      input.className = "edit-input";
      input.value = oldName;

      // Кнопка сохранения
      const saveButton = document.createElement("button");
      saveButton.type = "button";
      saveButton.textContent = "✓";
      saveButton.className = "save-button";

      // Кнопка отмены
      const cancelButton = document.createElement("button");
      cancelButton.type = "button";
      cancelButton.textContent = "✕";
      cancelButton.className = "cancel-button";

      // Скрываем старое название и карандаш
      nameElement.hidden = true;
      editButton.hidden = true;

      // Добавляем новые элементы
      element.append(input, saveButton, cancelButton);

      input.focus();
      input.select();

      // Сохраняем изменения
      function saveEdit() {
        const newName = input.value.trim();

        if (!newName) {
          input.focus();
          return;
        }

        nameElement.textContent = newName;

        finishEdit();
        saveContent();
      }

      // Отменяем изменения
      function cancelEdit() {
        finishEdit();
      }

      // Возвращаем обычный вид
      function finishEdit() {
        input.remove();
        saveButton.remove();
        cancelButton.remove();

        nameElement.hidden = false;
        editButton.hidden = false;
      }

      saveButton.addEventListener("click", saveEdit);
      cancelButton.addEventListener("click", cancelEdit);

      // Enter — сохранить
      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          saveEdit();
        }

        // Escape — отменить
        if (event.key === "Escape") {
          cancelEdit();
        }
      });
    });

  function addContent(entry) {
    if (!entry || typeof entry.name !== "string" || !entry.name.trim()) return;

    if (entry.type === "topic" && topicList) {
      contentContainer.append(createTopic(entry.name.trim()));
    } else if (entry.type === "item") {
      contentContainer.append(createItem(entry.name.trim()));
    }
  }
// Загружаем сохраненный контент из localStorage и фильтруем его
 let savedContent = readArray(contentStorageKey);

// Если нового хранилища ещё нет,
// пробуем найти старое по названию
if (savedContent.length === 0 && listName !== "Список") {
  savedContent = readArray(`content:${listName}`);

  // Если старого общего хранилища нет,
  // пробуем отдельные хранилища топиков и элементов
  if (savedContent.length === 0) {
    const oldTopics = topicList
      ? readArray(`topics:${listName}`)
          .filter((name) => typeof name === "string")
          .map((name) => ({
            type: "topic",
            name: name
          }))
      : [];

    const oldItems = readArray(`items:${listName}`)
      .filter((name) => typeof name === "string")
      .map((name) => ({
        type: "item",
        name: name
      }));

    savedContent = [...oldTopics, ...oldItems];
  }

  // Сохраняем перенесённые данные по новому ID
  saveArray(contentStorageKey, savedContent);
}

savedContent = savedContent.filter(
  (entry) =>
    entry &&
    (entry.type === "topic" || entry.type === "item") &&
    typeof entry.name === "string"
);
// Добавляем сохраненный контент на страницу и сохраняем его в localStorage
  savedContent.forEach(addContent);
  saveContent();

  if (listTitle) {
    listTitle.textContent = listName;
    document.title = listName;
  }
// Обработчики событий для добавления топиков и элементов
  if (topicInput && addTopicButton && topicList) {
    addTopicButton.addEventListener("click", (event) => {
      event.preventDefault();

      const name = topicInput.value.trim();
      if (!name) {
        topicInput.focus();
        return;
      }
// Добавляем новый топик в контейнер и сохраняем его
      contentContainer.append(createTopic(name));
      saveContent();
      topicInput.value = "";
      if (topicEditor && showTopicInputButton) {
        topicEditor.hidden = true;
        showTopicInputButton.hidden = false;
        showTopicInputButton.focus();
      }
    });
  }
// Обработчики событий для добавления элементов
  if (itemInput && addItemButton) {
    if (showItemInputButton && itemEditor) {
      showItemInputButton.addEventListener("click", () => {
        itemEditor.hidden = false;
        showItemInputButton.hidden = true;
        itemInput.focus();
      });
    }
// Обработчик события для кнопки добавления элемента
    addItemButton.addEventListener("click", (event) => {
      event.preventDefault();

      const name = itemInput.value.trim();
      if (!name) {
        itemInput.focus();
        return;
      }
// Добавляем новый элемент в контейнер и сохраняем его
      contentContainer.append(createItem(name));
      saveContent();
      itemInput.value = "";
      if (itemEditor && showItemInputButton) {
        itemEditor.hidden = true;
        showItemInputButton.hidden = false;
        showItemInputButton.focus();
      }
    });
  }
  // Редактирование топиков и элементов
contentContainer.addEventListener("click", (event) => {
  const button = event.target.closest(".edit-button");

  if (!button) return;

  const element = button.closest(".topic, .item");

  if (!element) return;

  const nameElement = element.classList.contains("topic")
    ? element.querySelector(".topic__name")
    : element.querySelector(".item__name");

  const oldName = nameElement.textContent;

  
  if (newName === null || !newName.trim()) return;

  nameElement.textContent = newName.trim();

  saveContent();
});
// Обработчики событий для перетаскивания топиков и элементов
  contentContainer.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) {
      return;
    }
    const target = event.target instanceof Element ? event.target : null;

    // Перетаскиваем только тогда, когда нажали на ручку ☰
    const handle = target?.closest(".drag-handle");

    if (!handle) return;

    const element = handle.closest(".topic, .item");

    if (!element || !contentContainer.contains(element)) return;

    // Если нажали на кнопку редактирования, не начинаем перетаскивание
    if (target?.closest(".edit-button")) return;

    if (!element || !contentContainer.contains(element)) return;

    draggedElement = element;
    activeContentPointerId = event.pointerId;
    contentContainer.setPointerCapture(event.pointerId);
    element.classList.add("dragging");
    event.preventDefault();
  });

  contentContainer.addEventListener("pointermove", (event) => {
    if (!draggedElement || event.pointerId !== activeContentPointerId) return;

    const others = Array.from(
      contentContainer.querySelectorAll(".topic, .item")
    ).filter((element) => element !== draggedElement);

    const afterElement = others.find((element) => {
      const bounds = element.getBoundingClientRect();
      const isSameRow =
        event.clientY >= bounds.top && event.clientY <= bounds.bottom;

      if (isSameRow) {
         return event.clientX < bounds.left + bounds.width / 2;
      }

      return event.clientY < bounds.top + bounds.height / 2;
    });

    if (afterElement) {
      contentContainer.insertBefore(draggedElement, afterElement);
    } else {
      contentContainer.append(draggedElement);
    }

    event.preventDefault();
  });

  function finishDrag(event) {
    if (!draggedElement || event.pointerId !== activeContentPointerId) return;

    draggedElement.classList.remove("dragging");
    draggedElement = null;
    activeContentPointerId = null;
    saveContent();
  }
// Обработчики событий для завершения перетаскивания
  contentContainer.addEventListener("pointerup", finishDrag);
  contentContainer.addEventListener("pointercancel", finishDrag);
  contentContainer.addEventListener("lostpointercapture", finishDrag);
}

contentContainer.addEventListener("click", (event) => {
  const button = event.target.closest(".show-item-input-button");

  if (!button) return;
  if (inside-list-show-item-input-button) {
    itemEditor.hidden = false;
    showItemInputButton.hidden = true;
    itemInput.focus();
  }
});
contentContainer.addEventListener("click", (event) => {
  const button = event.target.closest(".show-topic-input-button");
  if (!button) return;
  if (inside-list-show-topic-input-button) {
    topicEditor.hidden = false;
    showTopicInputButton.hidden = true;
    topicInput.focus();
  }
});