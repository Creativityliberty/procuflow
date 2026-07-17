const appShell = document.getElementById("appShell");
const collapseButton = document.getElementById("collapseSidebar");
const openMobile = document.getElementById("openMobile");
const closeMobile = document.getElementById("closeMobile");
const backdrop = document.getElementById("backdrop");
const requestDialog = document.getElementById("requestDialog");
const requestForm = document.getElementById("requestForm");
const toast = document.getElementById("toast");

if (window.localStorage.getItem("procuflow-preview-collapsed") === "true") {
  appShell?.classList.add("collapsed");
}

function refreshIcons() {
  window.lucide?.createIcons({ attrs: { "stroke-width": 1.8 } });
}

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => toast.classList.remove("visible"), 2400);
}

collapseButton?.addEventListener("click", () => {
  const collapsed = appShell?.classList.toggle("collapsed") ?? false;
  window.localStorage.setItem("procuflow-preview-collapsed", String(collapsed));
  collapseButton.title = collapsed ? "Agrandir le menu" : "Reduire le menu";
  collapseButton.querySelector("span").textContent = collapsed ? "Agrandir le menu" : "Reduire le menu";
  collapseButton.querySelector("svg")?.setAttribute("data-lucide", collapsed ? "panel-left-open" : "panel-left-close");
  refreshIcons();
});

function closeMobileMenu() { appShell?.classList.remove("mobile-open"); }
openMobile?.addEventListener("click", () => appShell?.classList.add("mobile-open"));
closeMobile?.addEventListener("click", closeMobileMenu);
backdrop?.addEventListener("click", closeMobileMenu);

document.querySelectorAll("[data-open-request]").forEach((button) => button.addEventListener("click", () => requestDialog?.showModal()));
document.querySelectorAll("[data-toast]").forEach((button) => button.addEventListener("click", () => showToast(button.dataset.toast)));

requestForm?.addEventListener("submit", (event) => {
  if (event.submitter?.value === "cancel") return;
  event.preventDefault();
  if (!requestForm.reportValidity()) return;
  requestDialog.close();
  requestForm.reset();
  showToast("Demande DA-2404 envoyee en validation");
});

refreshIcons();
