const API_URL = "https://script.google.com/macros/s/AKfycbwSi7IMjXOLWidU6Om13chBmP_BHLskK3XaNz67FPHI5cBQXE0ibaq-XS_Eq2VhMg59oA/exec";

const giftList = document.getElementById("giftList");

async function loadGifts() {
  try {
    giftList.innerHTML = "<p>Cargando desde Apps Script...</p>";

    const response = await fetch(API_URL);
    const data = await response.json();

    console.log(data);

    if (!data.ok) {
      giftList.innerHTML = "<p>Error desde Apps Script</p>";
      return;
    }

    giftList.innerHTML = "";

    data.gifts.forEach(gift => {
      const div = document.createElement("div");
      div.textContent = `${gift.name} - ${gift.taken ? "Tomado" : "Disponible"}`;
      div.style.padding = "10px";
      div.style.marginBottom = "8px";
      div.style.borderRadius = "8px";
      div.style.background = gift.taken ? "#ffd6d6" : "#ffffff";
      div.style.border = gift.taken ? "2px solid red" : "1px solid #ddd";

      giftList.appendChild(div);
    });

  } catch (error) {
    giftList.innerHTML = `<p>Error: ${error.message}</p>`;
    console.error(error);
  }
}

loadGifts();
