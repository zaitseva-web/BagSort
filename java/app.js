const listNameInput = document.getElementById("list_name");
const createListButton = document.getElementById("create-list-button");
const listsContainer = document.getElementById("lists");

const topicInput = document.getElementById("topic-input");
const addTopicButton = document.getElementById("add-topic-button");
const topicList = document.getElementById("topic-list");
const showTopicInputButton = document.getElementById("show-topic-input-button");
const topicEditor = document.getElementById("topic-editor");
const itemList = topicList || document.getElementById("item-list");

const itemInput = document.getElementById("item-input");
const addItemButton = document.getElementById("add-item-button");
const showItemInputButton = document.getElementById("show-item-input-button");
const itemEditor = document.getElementById("item-editor");
const listTitle = document.getElementById("list-title");

const listStorageKey = "lists";
let savedItems = [];
let itemStorageKey = "";
let draggedItem = null;
let activePointerId = null;

function readArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function saveArray(key, values) {
  try {
    localStorage.setItem(key, JSON.stringify(values));
  } catch {
    // Хранилище может быть недоступно.
  }
}

function getCurrentListName() {
  return new URLSearchParams(window.location.search).get("list") || "Список";
}

function createListCard(name) {
  const listItem = document.createElement("li");
  const link = document.createElement("a");
  link.className = "list-card";
  link.href = `inside_list.html?list=${encodeURIComponent(name)}`;

  const title = document.createElement("span");
  title.className = "list-card__title";
  title.textContent = name;

  const arrow = document.createElement("span");
  arrow.className = "list-card__arrow";
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = "→";

  link.append(title, arrow);
  listItem.append(link);
  return listItem;
}

if (listsContainer) {
  readArray(listStorageKey)
    .filter((name) => typeof name === "string")
    .forEach((name) => listsContainer.append(createListCard(name)));
}

if (listsContainer && createListButton && listNameInput) {
  createListButton.addEventListener("click", (event) => {
    event.preventDefault();

    const name = listNameInput.value.trim();
    if (!name) {
      listNameInput.focus();
      return;
    }

    listsContainer.append(createListCard(name));

    const lists = readArray(listStorageKey)
      .filter((savedName) => typeof savedName === "string");
    lists.push(name);
    saveArray(listStorageKey, lists);

    listNameInput.value = "";
    listNameInput.focus();
  });
}

function createTopic(name) {
  const topic = document.createElement("h3");
  topic.className = "topic";
  topic.textContent = name;
  return topic;
}

function createItem(name) {
  const item = document.createElement("div");
  item.className = "item inside-list-item-border";

  const itemName = document.createElement("span");
  itemName.className = "item__name";
  itemName.textContent = name;

  const handle = document.createElement("span");
  handle.className = "drag-handle";
  handle.setAttribute("aria-hidden", "true");
  handle.textContent = "☰";

  item.append(itemName, handle);
  return item;
}

const contentContainer = topicList || document.getElementById("item-list");

if (showTopicInputButton && topicEditor) {
  showTopicInputButton.addEventListener("click", () => {
    topicEditor.hidden = false;
    showTopicInputButton.hidden = true;
    topicInput?.focus();
  });
}

if (contentContainer) {
  const listName = getCurrentListName();
  const contentStorageKey = `content:${listName}`;
  let draggedElement = null;
  let activeContentPointerId = null;

  function getContent() {
    return Array.from(contentContainer.children)
      .filter((element) =>
        element.classList.contains("topic") ||
        element.classList.contains("item")
      )
      .map((element) => ({
        type: element.classList.contains("topic") ? "topic" : "item",
        name: element.classList.contains("topic")
          ? element.textContent.trim()
          : element.querySelector(".item__name")?.textContent.trim() || ""
      }))
      .filter((entry) => entry.name);
  }

  function saveContent() {
    saveArray(contentStorageKey, getContent());
  }

  function addContent(entry) {
    if (!entry || typeof entry.name !== "string" || !entry.name.trim()) return;

    if (entry.type === "topic" && topicList) {
      contentContainer.append(createTopic(entry.name.trim()));
    } else if (entry.type === "item") {
      contentContainer.append(createItem(entry.name.trim()));
    }
  }

  let savedContent = readArray(contentStorageKey).filter(
    (entry) =>
      entry &&
      (entry.type === "topic" || entry.type === "item") &&
      typeof entry.name === "string"
  );

  // Перенос данных из старых хранилищ при первом запуске этой версии.
  if (savedContent.length === 0) {
    const oldTopics = topicList
      ? readArray(`topics:${listName}`)
          .filter((name) => typeof name === "string")
          .map((name) => ({ type: "topic", name }))
      : [];

    const oldItems = readArray(`items:${listName}`)
      .filter((name) => typeof name === "string")
      .map((name) => ({ type: "item", name }));

    savedContent = [...oldTopics, ...oldItems];
  }

  savedContent.forEach(addContent);
  saveContent();

  if (listTitle) {
    listTitle.textContent = listName;
    document.title = listName;
  }

  if (topicInput && addTopicButton && topicList) {
    addTopicButton.addEventListener("click", (event) => {
      event.preventDefault();

      const name = topicInput.value.trim();
      if (!name) {
        topicInput.focus();
        return;
      }

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

  if (itemInput && addItemButton) {
    if (showItemInputButton && itemEditor) {
      showItemInputButton.addEventListener("click", () => {
        itemEditor.hidden = false;
        showItemInputButton.hidden = true;
        itemInput.focus();
      });
    }

    addItemButton.addEventListener("click", (event) => {
      event.preventDefault();

      const name = itemInput.value.trim();
      if (!name) {
        itemInput.focus();
        return;
      }

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

  contentContainer.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) {
      return;
    }

    const target = event.target instanceof Element ? event.target : null;
    const element = target?.closest(".topic, .item");

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

  contentContainer.addEventListener("pointerup", finishDrag);
  contentContainer.addEventListener("pointercancel", finishDrag);
  contentContainer.addEventListener("lostpointercapture", finishDrag);
}