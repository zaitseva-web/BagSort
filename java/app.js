const listNameInput = document.getElementById("list_name");
const createListButton = document.getElementById("create-list-button");
const listsContainer = document.getElementById("lists");

const topicInput = document.getElementById("topic");
const addTopicButton = document.getElementById("add-topic-button");
const topicList = document.getElementById("topic-list");
const itemList = topicList || document.getElementById("item-list");

const itemInput = document.getElementById("item-input");
const addItemButton = document.getElementById("add-item-button");
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

if (topicInput && addTopicButton && topicList) {
  const topicStorageKey = `topics:${getCurrentListName()}`;
  let draggedTopic = null;
  let topicPointerId = null;

  function saveTopics() {
    const topics = Array.from(topicList.querySelectorAll(".topic"))
      .map((element) => element.textContent.trim())
      .filter(Boolean);
    saveArray(topicStorageKey, topics);
  }

  function createTopic(name) {
    const topic = document.createElement("h3");
    topic.className = "topic";
    topic.textContent = name;
    return topic;
  }

  function getTopicAfter(pointerY) {
    return Array.from(topicList.querySelectorAll(".topic:not(.dragging)"))
      .reduce(
        (closest, topic) => {
          const bounds = topic.getBoundingClientRect();
          const offset = pointerY - bounds.top - bounds.height / 2;

          return offset < 0 && offset > closest.offset
            ? { offset, element: topic }
            : closest;
        },
        { offset: Number.NEGATIVE_INFINITY, element: null }
      ).element;
  }

  function finishTopicDrag(event) {
    if (!draggedTopic || event.pointerId !== topicPointerId) return;

    draggedTopic.classList.remove("dragging");
    saveTopics();

    const pointerId = topicPointerId;
    draggedTopic = null;
    topicPointerId = null;

    if (topicList.hasPointerCapture(pointerId)) {
      topicList.releasePointerCapture(pointerId);
    }
  }

  readArray(topicStorageKey)
    .filter((name) => typeof name === "string")
    .forEach((name) => topicList.append(createTopic(name)));

  addTopicButton.addEventListener("click", (event) => {
    event.preventDefault();

    const name = topicInput.value.trim();
    if (!name) {
      topicInput.focus();
      return;
    }

    topicList.append(createTopic(name));
    saveTopics();
    topicInput.value = "";
    topicInput.focus();
  });

  topicList.addEventListener("pointerdown", (event) => {
    const topic = event.target instanceof Element
      ? event.target.closest(".topic")
      : null;

    if (
      !topic ||
      !topicList.contains(topic) ||
      !event.isPrimary ||
      (event.pointerType === "mouse" && event.button !== 0)
    ) {
      return;
    }

    draggedTopic = topic;
    topicPointerId = event.pointerId;
    topicList.setPointerCapture(event.pointerId);
    draggedTopic.classList.add("dragging");
    event.preventDefault();
  });

  topicList.addEventListener("pointermove", (event) => {
    if (!draggedTopic || event.pointerId !== topicPointerId) return;

    event.preventDefault();
    const afterTopic = getTopicAfter(event.clientY);

    if (afterTopic) {
      topicList.insertBefore(draggedTopic, afterTopic);
    } else {
      topicList.append(draggedTopic);
    }
  });

  topicList.addEventListener("pointerup", finishTopicDrag);
  topicList.addEventListener("pointercancel", finishTopicDrag);
  topicList.addEventListener("lostpointercapture", finishTopicDrag);
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

function saveItemsFromDom() {
  if (!itemList || !itemStorageKey) return;

  savedItems = Array.from(itemList.querySelectorAll(".item__name"))
    .map((element) => element.textContent.trim())
    .filter(Boolean);

  saveArray(itemStorageKey, savedItems);
}

function getItemAfterElement(container, pointerY) {
  const elements = Array.from(
    container.querySelectorAll(".topic, .item:not(.dragging)")
  );

  return elements.reduce(
    (closest, element) => {
      const bounds = element.getBoundingClientRect();
      const offset = pointerY - bounds.top - bounds.height / 2;

      return offset < 0 && offset > closest.offset
        ? { offset, element }
        : closest;
    },
    { offset: Number.NEGATIVE_INFINITY, element: null }
  ).element;
}

function finishItemDrag(event) {
  if (!draggedItem || event.pointerId !== activePointerId) return;

  draggedItem.classList.remove("dragging");
  saveItemsFromDom();

  const pointerId = activePointerId;
  draggedItem = null;
  activePointerId = null;

  if (itemList.hasPointerCapture(pointerId)) {
    itemList.releasePointerCapture(pointerId);
  }
}

if (itemInput && addItemButton && itemList && listTitle) {
  const listName = getCurrentListName();
  itemStorageKey = `items:${listName}`;

  listTitle.textContent = listName;
  document.title = listName;

  savedItems = readArray(itemStorageKey)
    .filter((name) => typeof name === "string");
  savedItems.forEach((name) => itemList.append(createItem(name)));

  itemList.addEventListener("pointerdown", (event) => {
    const handle = event.target.closest(".drag-handle");
    if (
      !handle ||
      !itemList.contains(handle) ||
      !event.isPrimary ||
      (event.pointerType === "mouse" && event.button !== 0)
    ) {
      return;
    }

    draggedItem = handle.closest(".item");
    if (!draggedItem) return;

    activePointerId = event.pointerId;
    itemList.setPointerCapture(event.pointerId);
    draggedItem.classList.add("dragging");
    event.preventDefault();
  });

  itemList.addEventListener("pointermove", (event) => {
    if (!draggedItem || event.pointerId !== activePointerId) return;

    event.preventDefault();
    const afterElement = getItemAfterElement(itemList, event.clientY);

    if (afterElement) {
      itemList.insertBefore(draggedItem, afterElement);
    } else {
      itemList.append(draggedItem);
    }
  });

  itemList.addEventListener("pointerup", finishItemDrag);
  itemList.addEventListener("pointercancel", finishItemDrag);
  itemList.addEventListener("lostpointercapture", finishItemDrag);

  addItemButton.addEventListener("click", (event) => {
    event.preventDefault();

    const name = itemInput.value.trim();
    if (!name) {
      itemInput.focus();
      return;
    }

    itemList.append(createItem(name));
    saveItemsFromDom();
    itemInput.value = "";
    itemInput.focus();
  });
}