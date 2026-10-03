const listNameInput = document.getElementById("list_name");
const createListButton = document.getElementById("create-list-button");
const listsContainer = document.getElementById("lists");
const main = document.querySelector("main");
const storageKey = "lists";
let listNumber = 0;

function showListDetails(details) {
  const allDetails = document.querySelectorAll(".list-details");
  allDetails.forEach((section) => {
    section.hidden = true;
  });

  details.hidden = false;
  details.scrollIntoView({ behavior: "smooth", block: "start" });
}

function addList(listName) {
  const listId = `list-${++listNumber}`;
  const listItem = document.createElement("li");
  const listLink = document.createElement("a");
  listLink.className = "list-card";
  listLink.href = `#${listId}`;
  listLink.addEventListener("click", (event) => {
    event.preventDefault();
    const details = document.getElementById(listId);
    if (details) {
      showListDetails(details);
    }
  });

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

  const details = document.createElement("section");
  details.className = "list-details";
  details.id = listId;
  details.hidden = true;

  const backLink = document.createElement("a");
  backLink.className = "back-link";
  backLink.href = "#lists";
  backLink.textContent = "← Назад к спискам";
  backLink.addEventListener("click", (event) => {
    event.preventDefault();
    details.hidden = true;
    listsContainer.hidden = false;
    listsContainer.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  const heading = document.createElement("a");
  heading.className = "list-details__heading";
  heading.href = `#${listId}`;
  heading.textContent = listName;
  heading.addEventListener("click", (event) => {
    event.preventDefault();
    showListDetails(details);
  });

  const listContent = document.createElement("ul");
  details.append(backLink, heading, listContent);
  main.append(details);
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

