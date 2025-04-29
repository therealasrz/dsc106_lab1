console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
  ? ""                          
  : "/dsc106_lab1";    

  let pages = [
    { url: "", title: "Home" },
    { url: "projects/index.html", title: "Projects" },
    { url: "contact/index.html", title: "Contact" },
    { url: "resume/index.html", title: "Resume" },
    { url: "https://github.com/therealasrz", title: "GitHub" }
  ];

let nav = document.createElement("nav");
document.body.prepend(nav);

for (let p of pages) {
  let url = p.url;
  let title = p.title;

  url = !url.startsWith("http") ? `${BASE_PATH}/${url}` : url;
  nav.insertAdjacentHTML("beforeend", `<a href="${url}">${title}</a> | `);
}

let navLinks = $$("nav a");
let currentPath = location.pathname.endsWith("/") ? location.pathname + "index.html" : location.pathname;
let currentLink = navLinks.find(
  (a) => a.host === location.host && a.pathname === location.pathname
);
currentLink?.classList.add("current");

document.body.insertAdjacentHTML(
  'afterbegin',
  `
  <label class="color-scheme">
    Theme:
    <select id="color-mode-select">
      <option value="light dark">Automatic</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </label>
  `
);

const select = document.getElementById("color-mode-select");
const root = document.documentElement;

const savedScheme = localStorage.getItem("color-scheme");
if (savedScheme) {
  root.style.colorScheme = savedScheme;
  if (select) select.value = savedScheme;
}

select?.addEventListener("change", () => {
  const value = select.value;
  root.style.colorScheme = value;
  localStorage.setItem("color-scheme", value);
});

const form = document.querySelector("form");

form?.addEventListener("submit", function (event) {
  event.preventDefault(); 

  const data = new FormData(form);
  const params = [];

  for (let [name, value] of data) {
    params.push(`${name}=${encodeURIComponent(value)}`);
  }

  const url = `${form.action}?${params.join("&")}`;
  console.log("Opening mailto URL:", url); 
  location.href = url; 
});