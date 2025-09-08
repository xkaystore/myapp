function tambahCatatan() {
  let input = document.getElementById("noteInput");
  let list = document.getElementById("noteList");

  if (input.value.trim() !== "") {
    let li = document.createElement("li");
    li.textContent = input.value;
    list.appendChild(li);
    input.value = "";
  } else {
    alert("Catatan tidak boleh kosong!");
  }
}
