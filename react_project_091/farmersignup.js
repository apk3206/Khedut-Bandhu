// Get required elements
const form = document.getElementById("signupForm");
const username = document.getElementById("username");
const email = document.getElementById("email");
const phone = document.getElementById("phone");
const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirmPassword");
const signupButton = document.getElementById("signupbutton");
const errorMsg = document.getElementById("errorMsg");
const successMsg = document.getElementById("successMsg");
const googleSignupBtn = document.getElementById("googleSignupBtn");

// Form submit event
form.addEventListener("submit", async function (event) {
    event.preventDefault();

    // Reset messages
    errorMsg.style.display = "none";
    errorMsg.innerText = "";
    successMsg.style.display = "none";
    successMsg.innerText = "";

    // Validation
    if (username.value.trim() === "" || email.value.trim() === "" || 
        phone.value.trim() === "" || password.value.trim() === "" || 
        confirmPassword.value.trim() === "") {
        errorMsg.innerText = "All fields are required!";
        errorMsg.style.display = "block";
        signupButton.style.backgroundColor = "#e74c3c";
        return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.value)) {
        errorMsg.innerText = "Please enter a valid email address!";
        errorMsg.style.display = "block";
        signupButton.style.backgroundColor = "#e74c3c";
        return;
    }

    // Phone validation (basic)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone.value.replace(/\D/g, ''))) {
        errorMsg.innerText = "Please enter a valid 10-digit phone number!";
        errorMsg.style.display = "block";
        signupButton.style.backgroundColor = "#e74c3c";
        return;
    }

    // Password match validation
    if (password.value !== confirmPassword.value) {
        errorMsg.innerText = "Passwords do not match!";
        errorMsg.style.display = "block";
        signupButton.style.backgroundColor = "#e74c3c";
        return;
    }

    // Password length validation
    if (password.value.length < 6) {
        errorMsg.innerText = "Password must be at least 6 characters long!";
        errorMsg.style.display = "block";
        signupButton.style.backgroundColor = "#e74c3c";
        return;
    }

    // Disable button during submission
    signupButton.disabled = true;
    signupButton.value = "Signing Up...";

    try {
        const response = await fetch("http://localhost:3000/api/auth/signup", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username: username.value.trim(),
                email: email.value.trim(),
                phone: phone.value.replace(/\D/g, ''),
                password: password.value,
            }),
        });

        const data = await response.json();

        if (response.ok) {
            successMsg.innerText = "Signup successful! Redirecting to login...";
            successMsg.style.display = "block";
            signupButton.style.backgroundColor = "#2ecc71";
            
            // Redirect to login page after 2 seconds
            setTimeout(() => {
                window.location.href = "farmerlogin.html";
            }, 2000);
        } else {
            errorMsg.innerText = data.message || "Signup failed. Please try again.";
            errorMsg.style.display = "block";
            signupButton.style.backgroundColor = "#e74c3c";
            signupButton.disabled = false;
            signupButton.value = "Sign Up";
        }
    } catch (error) {
        console.error("Error:", error);
        errorMsg.innerText = "Network error. Please check your connection.";
        errorMsg.style.display = "block";
        signupButton.style.backgroundColor = "#e74c3c";
        signupButton.disabled = false;
        signupButton.value = "Sign Up";
    }
});

// Google Signup button click
googleSignupBtn.addEventListener("click", function () {
    window.location.href = "http://localhost:3000/api/auth/google";
});

// Hover effect for signup button
signupButton.addEventListener("mouseover", function () {
    if (!signupButton.disabled) {
        signupButton.style.backgroundColor = "#2ecc71";
    }
});

signupButton.addEventListener("mouseout", function () {
    if (!signupButton.disabled) {
        signupButton.style.backgroundColor = "";
    }
});

