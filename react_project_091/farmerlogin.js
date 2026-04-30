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

    document.getElementById("biometricBtn").addEventListener("click", () => {
        const userField = document.getElementById("username").value;
        if (!userField) {
            alert("Please enter your username/email first to identify your biometric key.");
            return;
        }

        // Simulate WebAuthn/Biometric Prompt
        const status = confirm("Use your device's fingerprint or face recognition to sign in as '" + userField + "'?");
        if (status) {
            alert("✅ Biometric Authentication Successful!");
            // Mock a successful login redirect
            const mockUser = {
                id: "65e1234567890abcdef12345",
                username: userField,
                role: "farmer",
                email: userField.includes("@") ? userField : userField + "@example.com",
                cart: []
            };
            window.location.href = "http://localhost:3001/dashboard?user=" + encodeURIComponent(JSON.stringify(mockUser));
        }
    });
