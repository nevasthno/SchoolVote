document.getElementById("loginButton").addEventListener("click", async () => {
  const email = document.getElementById("login").value.trim();
  const pass  = document.getElementById("password").value.trim();
  const role  = document.getElementById("role").value;

  if (!email || !pass || !role) {
    return alert("Будь ласка, заповніть всі поля.");
  }

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: pass, role })
    });

    if (res.status === 401) {
      return alert("Невірний email або пароль.");
    }
    if (res.status === 403) {
      return alert(`Ви не маєте ролі “${role}” в системі.`);
    }
    if (!res.ok) {
      return alert("Помилка: статус " + res.status);
    }

    const { token, role: realRole } = await res.json();
    localStorage.setItem("jwtToken", token);
    localStorage.setItem("userRole", realRole);

    if (realRole === "TEACHER") {
      window.location.href = "teacher.html";
    } else if (realRole === "PARENT") {
      window.location.href = "parent.html";
    } else if (realRole === "STUDENT") {
      window.location.href = "student.html";
    } else if (realRole === "DIRECTOR") {
      window.location.href = "director.html";
    }

  } catch (err) {
    console.error(err);
    alert("Не вдалося увійти.");
  }
});
