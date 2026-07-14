(function () {
  "use strict";

  const forms = Array.from(document.querySelectorAll(".enquiry-form"));

  function getErrorNode(form, field) {
    return form.querySelector(`[data-error-for="${field.id}"]`);
  }

  function setError(form, field, message) {
    const error = getErrorNode(form, field);
    field.setAttribute("aria-invalid", message ? "true" : "false");
    if (error) error.textContent = message || "";
  }

  function validateField(form, field) {
    const value = field.type === "checkbox" ? field.checked : field.value.trim();
    let message = "";

    if (field.required && !value) {
      message = field.type === "checkbox" ? "Please confirm consent to continue." : "This field is required.";
    } else if (field.type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      message = "Enter a valid work email.";
    } else if (field.name === "whatsapp" && value) {
      const digits = value.replace(/\D/g, "");
      if (digits.length < 10 || digits.length > 15) message = "Enter a valid WhatsApp number.";
    }

    setError(form, field, message);
    return !message;
  }

  function validateForm(form) {
    const fields = Array.from(form.querySelectorAll("input[required], select[required], textarea[required]"));
    const validity = fields.map(function (field) { return validateField(form, field); });
    if (validity.includes(false)) {
      fields[validity.indexOf(false)]?.focus();
      return false;
    }
    return true;
  }

  function prefill(option, challenge, context) {
    forms.forEach(function (form) {
      const help = form.elements.help_type;
      const challengeField = form.elements.primary_challenge;
      const contextField = form.elements.cta_context;
      if (help && option && Array.from(help.options).some(function (item) { return item.value === option; })) {
        help.value = option;
      }
      if (challengeField && challenge && Array.from(challengeField.options).some(function (item) { return item.value === challenge; })) {
        challengeField.value = challenge;
      }
      if (contextField) contextField.value = context || "General enquiry";
    });
  }

  document.addEventListener("click", function (event) {
    const trigger = event.target.closest("[data-enquiry-option]");
    if (!trigger) return;
    prefill(
      trigger.getAttribute("data-enquiry-option"),
      trigger.getAttribute("data-challenge"),
      trigger.textContent.trim()
    );
  });

  forms.forEach(function (form) {
    const status = form.querySelector(".form-status");
    const submit = form.querySelector('button[type="submit"]');
    const source = form.elements.source_page;
    if (source) source.value = document.body.dataset.page || window.location.pathname;

    form.querySelectorAll("input, select, textarea").forEach(function (field) {
      field.addEventListener("blur", function () {
        if (field.required || field.value) validateField(form, field);
      });
      field.addEventListener("input", function () {
        if (field.getAttribute("aria-invalid") === "true") validateField(form, field);
      });
      field.addEventListener("change", function () {
        if (field.getAttribute("aria-invalid") === "true") validateField(form, field);
      });
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      status.className = "form-status";
      status.textContent = "";
      if (!validateForm(form)) {
        status.textContent = "Please review the highlighted fields.";
        return;
      }

      submit.disabled = true;
      submit.classList.add("is-loading");
      submit.setAttribute("aria-busy", "true");
      const originalText = submit.firstChild?.textContent || "Submit enquiry";
      if (submit.firstChild) submit.firstChild.textContent = "Preparing enquiry";

      window.setTimeout(function () {
        submit.disabled = false;
        submit.classList.remove("is-loading");
        submit.removeAttribute("aria-busy");
        if (submit.firstChild) submit.firstChild.textContent = originalText;
        status.className = "form-status is-success";
        status.textContent = "Thank you — your enquiry has been captured in this prototype. Connect DigiProd’s production endpoint before launch.";
        status.tabIndex = -1;
        status.focus();
      }, 700);
    });
  });

  window.DigiProdForms = { prefill: prefill };
})();
