(function () {
    function validateEmail(email) {
        return String(email)
            .toLowerCase()
            .match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
    }

    function showError(input, errorElement, show) {
        if (!input || !errorElement) return;
        input.classList.toggle('invalid', show);
        errorElement.style.display = show ? 'block' : 'none';
    }

    window.initAuthForm = function initAuthForm(config) {
        var form = document.getElementById(config.formId);
        if (!form) return;

        var emailInput = document.getElementById(config.emailId || 'email');
        var passwordInput = document.getElementById(config.passwordId || 'password');
        var emailError = document.getElementById(config.emailErrorId || 'emailError');
        var passwordError = document.getElementById(config.passwordErrorId || 'passwordError');
        var toggleBtn = document.getElementById(config.togglePasswordId || 'togglePassword');

        if (toggleBtn && passwordInput) {
            toggleBtn.addEventListener('click', function () {
                var type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                var icon = toggleBtn.querySelector('i');
                if (icon) {
                    icon.classList.toggle('bi-eye');
                    icon.classList.toggle('bi-eye-slash');
                }
            });
        }

        if (emailInput && emailError) {
            emailInput.addEventListener('input', function () {
                if (emailInput.classList.contains('invalid')) {
                    showError(emailInput, emailError, false);
                }
            });
        }

        if (passwordInput && passwordError) {
            passwordInput.addEventListener('input', function () {
                if (passwordInput.classList.contains('invalid')) {
                    showError(passwordInput, passwordError, false);
                }
            });
        }

        form.addEventListener('submit', function (e) {
            var isValid = true;

            if (emailInput && emailError && !validateEmail(emailInput.value)) {
                showError(emailInput, emailError, true);
                isValid = false;
            }

            if (passwordInput && passwordError && passwordInput.value.length < 6) {
                showError(passwordInput, passwordError, true);
                isValid = false;
            }

            if (!isValid) {
                e.preventDefault();
                return;
            }

            var btn = form.querySelector('.btn-login');
            if (btn) {
                btn.innerText = config.loadingText || 'Please wait...';
                btn.disabled = true;
            }
        });
    };
})();
