function updateTime() {
  const now = new Date();
  const jakartaTime = now.toLocaleTimeString("en-US", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const clockElement = document.getElementById("clock");
  if (clockElement) {
    clockElement.textContent = jakartaTime;
  }
}

updateTime();
setInterval(updateTime, 1000);
