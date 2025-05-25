document.addEventListener("DOMContentLoaded", () => {
  const toggleButton = document.getElementById("darkModeToggle");

  toggleButton.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
  });
});
//git add . 
//git commit -m "with anchor"
//git push origin main

