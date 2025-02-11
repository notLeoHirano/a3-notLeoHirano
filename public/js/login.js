document.addEventListener("DOMContentLoaded", async function () {
  const loginForm = document.getElementById("login-form");

  loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    try {
      const response = await fetch("/login", {
        method: "POST",
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: new URLSearchParams({
          username: username, password: password }),
        credentials: 'same-origin',
      });

      if (response.ok) {
        window.location.href = "/";
      } else {
        const errorText = await response.text();
        alert("Login failed: " + errorText);
      }
    } catch (error) {
      console.error("Error during login:", error);
      alert("An error occurred during login. Please try again.");
    }
  });
});