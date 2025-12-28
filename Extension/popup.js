chrome.runtime.sendMessage({ type: "GET_TRACK_STATUS" }, response => {
  const dot = document.getElementById("dot");
  const text = document.getElementById("text");

  if (!response || !response.active) {
    dot.classList.add("active");
    text.textContent = "Tracking is Live";
  }
});
