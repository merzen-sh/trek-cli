export function scrollToElement(id: string) {
  const escapedId = id.replace(/(:|\.|\[|\]|,|=)/g, "\\$1");
  const element = document.getElementById(escapedId) || document.getElementById(id);

  if (element) {
    element.scrollIntoView({ behavior: "smooth", block: "center" });
    element.classList.add("ring-4", "ring-primary/40", "transition-all", "duration-300");
    setTimeout(() => {
      element.classList.remove("ring-4", "ring-primary/40");
    }, 1200);
  }
}
