const API_URL = "https://script.google.com/macros/s/AKfycbxF8ws2mYNcRxBB3REZ_B5GMMZVe13hm467H-dB-wFiryGkSn_fQFMbZLM00F6-KrGWVg/exec";

const giftList = document.getElementById("giftList");
const reserveBtn = document.getElementById("reserveBtn");
const message = document.getElementById("message");
const emailInput = document.getElementById("email");

const myReservationsBtn = document.getElementById("myReservationsBtn");
const myReservations = document.getElementById("myReservations");

let gifts = [];

async function loadGifts() {
  try {
    giftList.innerHTML = "<p>Cargando regalos...</p>";

    const response = await fetch(API_URL);
    const data = await response.json();

    console.log("Lista recibida:", data);

    if (!data.ok) {
      throw new Error(data.message || "Error al cargar regalos");
    }

    gifts = data.gifts;
    renderGifts();

  } catch (error) {
    console.error("Error al cargar regalos:", error);

    giftList.innerHTML = `
      <div class="gift-item taken">
        <div>
          <span class="gift-name">No se pudo cargar la lista</span>
          <br>
          <small>${error.message}</small>
        </div>
      </div>
    `;
  }
}

function renderGifts() {
  giftList.innerHTML = "";

  gifts.forEach(gift => {
    const item = document.createElement("div");
    item.className = `gift-item ${gift.taken ? "taken" : "available"}`;

    const stock = gift.stock || 1;
    const remaining = gift.remaining ?? 0;

    if (gift.taken) {
      item.innerHTML = `
        <div>
          <span class="gift-name">${gift.name}</span>
          <br>
          <small>Stock agotado</small>
        </div>
        <span class="status">Tomado</span>
      `;
    } else {
      item.innerHTML = `
        <label>
          <input type="checkbox" value="${gift.id}" class="gift-checkbox">
          <span class="gift-name">${gift.name}</span>
          <br>
          <small>Quedan ${remaining} de ${stock}</small>
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
        action: "reserve",
        email: email,
        items: selectedItems
      })
    });

    const data = await response.json();

    console.log("Respuesta reserva:", data);

    if (!data.ok) {
      showMessage(data.message || "No se pudo confirmar la selección.", "error");
      await loadGifts();
      return;
    }

    showMessage("¡Listo! Tus regalos fueron reservados correctamente.", "success");

    await loadGifts();
    await loadMyReservations();

  } catch (error) {
    console.error("Error al reservar:", error);
    showMessage("Ocurrió un error: " + error.message, "error");
  } finally {
    reserveBtn.disabled = false;
    reserveBtn.textContent = "Confirmar regalos";
  }
}

async function loadMyReservations() {
  const email = emailInput.value.trim().toLowerCase();

  clearMessage();
  myReservations.innerHTML = "";

  if (!email) {
    showMessage("Ingresa tu correo para ver tus regalos.", "error");
    return;
  }

  if (!validateEmail(email)) {
    showMessage("Ingresa un correo válido.", "error");
    return;
  }

  try {
    myReservations.innerHTML = "<p>Cargando tus regalos...</p>";

    const url = `${API_URL}?action=myReservations&email=${encodeURIComponent(email)}`;

    const response = await fetch(url);
    const data = await response.json();

    console.log("Mis reservas:", data);

    if (!data.ok) {
      throw new Error(data.message || "No se pudieron cargar tus reservas");
    }

    renderMyReservations(data.reservations);

  } catch (error) {
    console.error("Error al cargar mis reservas:", error);
    myReservations.innerHTML = `<p>Error: ${error.message}</p>`;
  }
}

function renderMyReservations(reservations) {
  myReservations.innerHTML = "";

  if (!reservations || reservations.length === 0) {
    myReservations.innerHTML = "<p>No tienes regalos reservados con este correo.</p>";
    return;
  }

  reservations.forEach(reservation => {
    const item = document.createElement("div");
    item.className = "reservation-item";

    item.innerHTML = `
      <span>${reservation.itemName}</span>
      <button class="cancel-btn" data-item="${reservation.itemId}">
        Liberar
      </button>
    `;

    myReservations.appendChild(item);
  });

  const cancelButtons = document.querySelectorAll(".cancel-btn");

  cancelButtons.forEach(button => {
    button.addEventListener("click", async () => {
      const itemId = button.getAttribute("data-item");
      await cancelReservation(itemId);
    });
  });
}

async function cancelReservation(itemId) {
  const email = emailInput.value.trim().toLowerCase();

  if (!email || !validateEmail(email)) {
    showMessage("Ingresa tu correo válido.", "error");
    return;
  }

  const confirmCancel = confirm("¿Seguro que quieres liberar este regalo?");

  if (!confirmCancel) {
    return;
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify({
        action: "cancel",
        email: email,
        itemId: itemId
      })
    });

    const data = await response.json();

    console.log("Respuesta liberar:", data);

    if (!data.ok) {
      showMessage(data.message || "No se pudo liberar el regalo.", "error");
      return;
    }

    showMessage("Regalo liberado correctamente. Ahora puedes elegir otro.", "success");

    await loadGifts();
    await loadMyReservations();

  } catch (error) {
    console.error("Error al liberar:", error);
    showMessage("Ocurrió un error: " + error.message, "error");
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
myReservationsBtn.addEventListener("click", loadMyReservations);

loadGifts();
