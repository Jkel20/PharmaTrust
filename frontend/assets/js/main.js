document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = e.target.username.value;
      const password = e.target.password.value;

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password }),
        });

        const data = await res.json();

        if (res.ok) {
          // In a real app, you'd save the token and redirect
          alert('Logged in successfully!');
          window.location.href = 'pages/dashboard.html';
        } else {
          alert(data.msg || 'Login failed');
        }
      } catch (err) {
        console.error(err);
        alert('An error occurred');
      }
    });
  }

  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = e.target.username.value;
      const password = e.target.password.value;

      try {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password }),
        });

        const data = await res.json();

        if (res.ok) {
          alert('Signed up successfully! Please login.');
          window.location.href = 'index.html';
        } else {
          alert(data.msg || 'Sign up failed');
        }
      } catch (err) {
        console.error(err);
        alert('An error occurred');
      }
    });
  }
});
