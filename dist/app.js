import {
  $,
  escapeHTML as esc,
  dateKey,
  shiftDay,
  toast,
  load,
  save,
  download,
  readBackup,
  wireDialog,
} from "./shared.js";
import { validState, streak, daily, weekKeys } from "./model.js";
const KEY = "ritm.v1";
let state = load(KEY, { habits: [] }, validState),
  selected = dateKey(),
  weekStart = selected,
  monthDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1, 12);
const paths = {
  leaf: '<path d="M20 4C8 2 2 9 6 16s16 1 14-12Z"/><path d="m4 21 12-12"/>',
  book: '<path d="M12 6C8 3 5 3 2 4v15c3-1 6-1 10 2 4-3 7-3 10-2V4c-3-1-6-1-10 2Z"/><path d="M12 6v15"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1"/>',
  moon: '<path d="M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z"/>',
  water:
    '<path d="M12 2S5 10 5 15a7 7 0 0 0 14 0c0-5-7-13-7-13Z"/><path d="M8 15a4 4 0 0 0 4 4"/>',
};
const dialog = $("#habit-dialog");
wireDialog(dialog);
function persist() {
  save(KEY, state);
  render();
}
function render() {
  const today = dateKey(),
    metric = daily(state.habits, selected),
    keys = weekKeys(weekStart);
  $("#month-label").textContent = new Date(
    selected + "T12:00:00",
  ).toLocaleDateString("ru", { month: "long" });
  $("#week-range").textContent =
    new Date(keys[0] + "T12:00:00").toLocaleDateString("ru", {
      day: "numeric",
      month: "short",
    }) +
    " — " +
    new Date(keys[6] + "T12:00:00").toLocaleDateString("ru", {
      day: "numeric",
      month: "short",
    });
  $("#week-days").innerHTML = keys
    .map(
      (k) =>
        '<button class="day ' +
        (k === selected ? "selected " : "") +
        (k === today ? "today " : "") +
        (daily(state.habits, k).done ? "marked" : "") +
        '" data-date="' +
        k +
        '" aria-label="' +
        new Date(k + "T12:00:00").toLocaleDateString("ru", {
          day: "numeric",
          month: "long",
        }) +
        '" aria-pressed="' +
        (k === selected) +
        '" ' +
        (k > today ? "disabled" : "") +
        "><small>" +
        new Date(k + "T12:00:00").toLocaleDateString("ru", {
          weekday: "short",
        }) +
        "</small><strong>" +
        Number(k.slice(-2)) +
        "</strong></button>",
    )
    .join("");
  $("#next-week").disabled = keys[6] >= today;
  $("#day-title").textContent =
    selected === today
      ? "Ваши маленькие шаги"
      : new Date(selected + "T12:00:00").toLocaleDateString("ru", {
          day: "numeric",
          month: "long",
        }) + " · ваши шаги";
  $("#daily-count").textContent = metric.done + " / " + metric.total;
  const active = state.habits.filter((h) => h.created <= selected);
  $("#empty-state").hidden = state.habits.length > 0;
  $("#habit-list").innerHTML =
    active
      .map(
        (h) =>
          '<article class="habit ' +
          h.color +
          " " +
          (h.dates.includes(selected) ? "done" : "") +
          '"><span class="habit-icon" aria-hidden="true"><svg viewBox="0 0 24 24">' +
          paths[h.icon] +
          '</svg></span><div class="habit-content"><button class="habit-title" data-edit="' +
          h.id +
          '">' +
          esc(h.title) +
          '</button><p class="habit-note">' +
          esc(h.note || "Один маленький шаг каждый день") +
          '</p></div><span class="habit-streak">' +
          streak(h, today) +
          ' дн. подряд</span><button class="habit-check" data-check="' +
          h.id +
          '" aria-label="' +
          esc("Отметить: " + h.title) +
          '" aria-pressed="' +
          h.dates.includes(selected) +
          '">' +
          (h.dates.includes(selected) ? "✓" : "") +
          '</button><button class="habit-delete" data-delete="' +
          h.id +
          '" aria-label="' +
          esc("Удалить: " + h.title) +
          '">×</button></article>',
      )
      .join("") +
    (state.habits.length && !active.length
      ? '<div class="empty">В этот день привычек ещё не было.<br>Вернитесь к сегодняшнему дню.</div>'
      : "");
  $("#day-percent").innerHTML = metric.percent + "<span>%</span>";
  $("#ring-progress").style.strokeDashoffset =
    408.4 * (1 - metric.percent / 100);
  $("#encouragement").textContent =
    metric.percent === 100
      ? "Все шаги сделаны."
      : metric.done
        ? "Вы уже в своём ритме."
        : "Всё начинается с шага.";
  $("#encouragement-note").textContent =
    metric.percent === 100
      ? "Заметить свой прогресс — тоже важно."
      : "Не торопитесь. Один шаг лучше, чем ни одного.";
  const current = weekKeys(today),
    counts = current.map((k) => daily(state.habits, k).done),
    max = Math.max(1, ...counts);
  $("#weekly-total").textContent = counts.reduce((a, b) => a + b, 0);
  $("#week-bars").innerHTML = current
    .map(
      (k, i) =>
        '<div class="week-bar" title="' +
        k +
        ": " +
        counts[i] +
        '"><i class="' +
        (counts[i] ? "filled" : "") +
        '" style="height:' +
        Math.max(4, (counts[i] / max) * 75) +
        '%"></i><small>' +
        new Date(k + "T12:00:00").toLocaleDateString("ru", {
          weekday: "short",
        }) +
        "</small></div>",
    )
    .join("");
  $("#best-streak").textContent =
    Math.max(0, ...state.habits.map((h) => streak(h, today))) + " дн.";
  renderCalendar();
}
function renderCalendar() {
  const today = dateKey(),
    year = monthDate.getFullYear(),
    month = monthDate.getMonth(),
    first = (new Date(year, month, 1).getDay() + 6) % 7,
    days = new Date(year, month + 1, 0).getDate();
  $("#calendar-month").textContent = monthDate
    .toLocaleDateString("ru", { month: "long", year: "numeric" })
    .replace(" г.", "");
  $("#next-month").disabled =
    year > new Date().getFullYear() ||
    (year === new Date().getFullYear() && month >= new Date().getMonth());
  $("#calendar").innerHTML =
    ["ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "ВС"]
      .map((d) => '<span class="weekday">' + d + "</span>")
      .join("") +
    Array.from({ length: first }, () => "<span></span>").join("") +
    Array.from({ length: days }, (_, i) => {
      const key = dateKey(new Date(year, month, i + 1, 12)),
        m = daily(state.habits, key),
        level = m.percent === 100 ? 3 : m.percent >= 50 ? 2 : m.done ? 1 : 0;
      return (
        '<button class="calendar-day level' +
        level +
        (key === today ? " is-today" : "") +
        (key === selected ? " is-selected" : "") +
        '" data-calendar="' +
        key +
        '" aria-label="' +
        key +
        ", выполнено " +
        m.done +
        " из " +
        m.total +
        '" ' +
        (key > today ? "disabled" : "") +
        "><span>" +
        (i + 1) +
        "</span>" +
        (m.done ? "<small>" + m.done + " ✓</small>" : "") +
        "</button>"
      );
    }).join("");
}
function edit(h, suggestion = "", icon = "leaf") {
  $("#habit-id").value = h?.id || "";
  $("#habit-title").value = h?.title || suggestion;
  $("#habit-note").value = h?.note || "";
  $("#habit-icon").value = h?.icon || icon;
  $("#habit-color").value = h?.color || "sage";
  $("#dialog-title").textContent = h ? "Изменить привычку" : "Новая привычка";
  dialog.showModal();
  $("#habit-title").focus();
}
$("#add-habit").onclick = () => edit();
$("#add-another").onclick = () => edit();
document
  .querySelectorAll("[data-suggest]")
  .forEach(
    (b) => (b.onclick = () => edit(null, b.dataset.suggest, b.dataset.icon)),
  );
$("#habit-form").onsubmit = (event) => {
  event.preventDefault();
  const title = $("#habit-title").value.trim();
  if (!title) {
    $("#habit-title").focus();
    return;
  }
  const h = {
    id: $("#habit-id").value || crypto.randomUUID(),
    title,
    note: $("#habit-note").value.trim(),
    icon: $("#habit-icon").value,
    color: $("#habit-color").value,
  };
  const existing = state.habits.find((x) => x.id === h.id);
  if (existing) Object.assign(existing, h);
  else {
    if (state.habits.length >= 100) {
      toast("Лимит — 100 привычек.");
      return;
    }
    state.habits.push({ ...h, created: dateKey(), dates: [] });
    selected = dateKey();
    weekStart = selected;
  }
  persist();
  dialog.close();
  toast("Привычка сохранена");
};
$("#habit-list").onclick = (event) => {
  const b = event.target.closest("button");
  if (!b) return;
  if (b.dataset.edit) edit(state.habits.find((h) => h.id === b.dataset.edit));
  if (b.dataset.check) {
    const h = state.habits.find((h) => h.id === b.dataset.check);
    if (selected > dateKey() || selected < h.created) return;
    h.dates = h.dates.includes(selected)
      ? h.dates.filter((d) => d !== selected)
      : [...h.dates, selected];
    persist();
  }
  if (b.dataset.delete && confirm("Удалить привычку вместе с её историей?")) {
    state.habits = state.habits.filter((h) => h.id !== b.dataset.delete);
    persist();
  }
};
$("#week-days").onclick = (event) => {
  const b = event.target.closest("[data-date]");
  if (b && !b.disabled) {
    selected = b.dataset.date;
    monthDate = new Date(selected.slice(0, 7) + "-01T12:00:00");
    render();
  }
};
$("#prev-week").onclick = () => {
  weekStart = shiftDay(weekStart, -7);
  render();
};
$("#next-week").onclick = () => {
  weekStart = shiftDay(weekStart, 7);
  render();
};
$("#go-today").onclick = () => {
  selected = dateKey();
  weekStart = selected;
  monthDate = new Date(selected.slice(0, 7) + "-01T12:00:00");
  render();
};
$("#prev-month").onclick = () => {
  monthDate = new Date(
    monthDate.getFullYear(),
    monthDate.getMonth() - 1,
    1,
    12,
  );
  renderCalendar();
};
$("#next-month").onclick = () => {
  monthDate = new Date(
    monthDate.getFullYear(),
    monthDate.getMonth() + 1,
    1,
    12,
  );
  renderCalendar();
};
$("#calendar").onclick = (event) => {
  const b = event.target.closest("[data-calendar]");
  if (b && !b.disabled) {
    selected = b.dataset.calendar;
    weekStart = selected;
    render();
    $(".habits-section").scrollIntoView({
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    });
  }
};
$("#export").onclick = () =>
  download("ritm-" + dateKey() + ".json", {
    app: "ritm",
    version: 1,
    data: state,
  });
$("#import").onclick = () => $("#import-file").click();
$("#import-file").onchange = async (event) => {
  try {
    const next = await readBackup(event.target.files[0], "ritm", validState);
    if (confirm("Заменить привычки и историю резервной копией?")) {
      state = next;
      persist();
      toast("Привычки восстановлены");
    }
  } catch (error) {
    toast(error.message);
  }
  event.target.value = "";
};
render();
setInterval(render, 60000);
