const API_URL = "https://script.google.com/macros/s/AKfycbwankf0hjNWRPbQmPKANkCuM-M5ssoJ-DvUU2QVWJHHkq6ArtBXLts9T5U4n75zEDmr0Q/exec";

const giftList = document.getElementById("giftList");
const reserveBtn = document.getElementById("reserveBtn");
const message = document.getElementById("message");
const emailInput = document.getElementById("email");

let gifts = [];

async function loadGifts() {
  try {
    giftList.innerHTML = "<p>Cargando regalos...</p>";

    const response = await fetch(API_URL);
    const data = await response.json();

    if (!data.ok) {
      throw new Error(data.message || "Error al cargar regalos");
    }

    gifts = data.gifts;
    renderGifts();

  } catch (error) {
    giftList.innerHTML = "<p>No se pudo cargar la lista de regalos.</p>";
    console.error(error);
  }
}

function renderGifts() {
  giftList.innerHTML = "";

  gifts.forEach(gift => {
    const item = document.createElement("div");
    item.className = `gift-item ${gift.taken ? "taken" : "available"}`;

    if (gift.taken) {
      item.innerHTML = `
        <div>
          <span class="gift-name">${gift.name}</span>
        </div>
        <span class="status">Tomado</span>
      `;
    } else {
      item.innerHTML = `
        <label>
          <input type="checkbox" value="${gift.id}" class="gift-checkbox">
          <span class="gift-name">${gift.name}</span>
        </label>
        <span class="status">Disponible</span>
      `;
    }

    giftList.appendChild(item);
  });

  const checkboxes = document.querySelectorAll(".gift-checkbox");

  checkboxes.forEach(checkbox => {
    checkbox.addEventListener("change", () => {
      const selected = document.querySelectorAll(".gift-checkbox:checked");

      if (selected.length > 3) {
        checkbox.checked = false;
        showMessage("Solo puedes seleccionar hasta 3 regalos.", "error");
      }
    });
  });
}

async function reserveGifts() {
  const email = emailInput.value.trim().toLowerCase();
  const selectedCheckboxes = document.querySelectorAll(".gift-checkbox:checked");
  const selectedItems = Array.from(selectedCheckboxes).map(cb => cb.value);

  clearMessage();

  if (!email) {
    showMessage("Debes ingresar tu correo.", "error");
    return;
  }

  if (!validateEmail(email)) {
    showMessage("Ingresa un correo válido.", "error");
    return;
  }

  if (selectedItems.length === 0) {
    showMessage("Debes seleccionar al menos un regalo.", "error");
    return;
  }

  if (selectedItems.length > 3) {
    showMessage("Solo puedes seleccionar hasta 3 regalos.", "error");
    return;
  }

  try {
    reserveBtn.disabled = true;
    reserveBtn.textContent = "Confirmando...";

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify({
        email: email,
        items: selectedItems
      })
    });

    const data = await response.json();

    if (!data.ok) {
      showMessage(data.message || "No se pudo confirmar la selección.", "error");
      await loadGifts();
      return;
    }

    showMessage("¡Listo! Tus regalos fueron reservados correctamente.", "success");
    emailInput.value = "";
    await loadGifts();

  } catch (error) {
    console.error(error);
    showMessage("Ocurrió un error. Intenta nuevamente.", "error");
  } finally {
    reserveBtn.disabled = false;
    reserveBtn.textContent = "Confirmar regalos";
  }
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showMessage(text, type) {
  message.textContent = text;
  message.className = `message ${type}`;
}

function clearMessage() {
  message.textContent = "";
  message.className = "message";
}

reserveBtn.addEventListener("click", reserveGifts);

loadGifts();
