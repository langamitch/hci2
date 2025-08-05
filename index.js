

  document.addEventListener("DOMContentLoaded", function () {
    // --- Card Overlay Logic ---
    const openOverlayBtns = document.querySelectorAll(".launch-btn");
    const cardOverlay = document.getElementById("overlay");
    const cardCloseBtn = document.querySelector(".close-btn");
    const overlayTitle = document.getElementById("overlay-title");
    const overlayCode = document.getElementById("overlay-code");
    const overlayDescription = document.getElementById("overlay-description");

    const descriptions = {
      // You can uncomment and fill in your descriptions here
      "HUMAN COMPUTER INTERACTION II": "This module focuses on designing intuitive interfaces and understanding user behavior.",
      "DEVELOPMENT SOFTWARE II": "Covers advanced techniques in software development and agile methodologies.",
      "INFORMATION SYSTEMS I": "Introduces low-level programming, data structures, and debugging strategies.",
      "DEVELOPMENT SOFTWARE I": "Introduces low-level programming, data structures, and debugging strategies.",
      "INFORMATION TECHNOLOGY SKILLS I": "information skills.",
      "SYSTEM SOFTWARE I": "Introduces computers..",
      "TECNICAL PROGRAMMING I": "Introduces low-level programming, data structures, and debugging strategies.",
      "INFORMATION SYSTEMS II": "IS"
    };

    openOverlayBtns.forEach((button) => {
      button.addEventListener("click", function () {
        // Find the parent card of the button that was clicked
        const card = button.closest(".card");
        if (card) {
          const title = card.querySelector("h2").textContent.trim();
          const code = card.querySelector("p").textContent.trim();
          const description = descriptions[title] || "No description available.";

          overlayTitle.textContent = title;
          overlayCode.textContent = code;
          overlayDescription.textContent = description;
          cardOverlay.style.display = "flex";
        }
      });
    });

    const closeCardOverlay = () => {
      cardOverlay.style.display = "none";
    };

    cardCloseBtn.addEventListener("click", closeCardOverlay);

    cardOverlay.addEventListener("click", function (e) {
      if (e.target === cardOverlay) {
        closeCardOverlay();
      }
    });
  });
