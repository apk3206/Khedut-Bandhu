const form = document.getElementById("loginForm");
const otpSection = document.getElementById("otpSection");
let loggedUserId = null;

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const res = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: username.value,
      password: password.value,
    }),
  });

  const data = await res.json();

  if (!res.ok) return alert(data.message);

  loggedUserId = data.userId;
  otpSection.style.display = "block";
});

verifyOtpBtn.addEventListener("click", async () => {
  const otpValue = otp.value;

  const res = await fetch("http://localhost:3000/api/auth/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: loggedUserId,
      otp: otpValue,
    }),
  });

  const data = await res.json();

  if (res.ok) {
  const user = data.user;

  window.location.href =
    "http://localhost:3001/dashboard?user=" +
    encodeURIComponent(JSON.stringify(user));
}


  // if (!res.ok) {
  //   alert(data.message);
  //   return;
  // }

  // // ✅ THIS LINE WAS FAILING EARLIER
  // localStorage.setItem("user", JSON.stringify(data.user));

  // console.log("User saved:", data.user);

  // // ✅ Redirect AFTER storing user
  // window.location.href = "http://localhost:3001/dashboard";
});
