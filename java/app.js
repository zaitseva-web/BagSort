console.log("Приложение запущено");

const list = document.querySelector(".list-card");

list.addEventListener("click", function () {
    console.log("На список нажали");
});

// create list
let list_name = document.getElementById('list_name');

list_name.addEventListener('list_name', function(event) {
  console.log(event.target.value);
});
