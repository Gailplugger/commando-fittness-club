(function () {
  "use strict";
  document.addEventListener("DOMContentLoaded", async () => {
    if (!(await window.CommandoAdminReady)) return;
    const root = document.querySelector("#admin-surveys-list");
    const modal = document.querySelector("#survey-modal");
    const form = document.querySelector("#survey-form");
    const builder = document.querySelector("#question-builder");
    const search = document.querySelector("#survey-search");
    const statusFilter = document.querySelector("#survey-status-filter");
    const count = document.querySelector("#survey-count");
    const empty = document.querySelector("#surveys-empty");
    const listStatus = document.querySelector("#survey-list-status");
    const refreshButton = document.querySelector("#refresh-surveys-btn");
    if (!root || !modal || !form || !builder) return;
    let editing = null;
    let questions = [];
    const esc = CommandoUI.escapeHtml;
    const renderList = () => {
      const query = search?.value.trim().toLowerCase() || "";
      const selectedStatus = statusFilter?.value || "all";
      const surveys = CommandoData.getSurveys();
      const filtered = surveys.filter((survey) =>
        (selectedStatus === "all" || survey.status === selectedStatus) &&
        `${survey.title} ${survey.description}`.toLowerCase().includes(query)
      );
      count.textContent = `${filtered.length} of ${surveys.length} survey${surveys.length === 1 ? "" : "s"}`;
      empty.hidden = filtered.length !== 0;
      root.hidden = filtered.length === 0;
      root.innerHTML = filtered.map((survey) => `<article class="survey-card-admin"><div class="survey-card-top"><span class="badge ${survey.status === "Published" ? "live" : ""}">${esc(survey.status || "Draft")}</span><span class="survey-question-count">${survey.questions.length} questions · ${survey.minutes || 3} min</span></div><h2>${esc(survey.title || "Untitled survey")}</h2><p>${esc(survey.description || "No description")}</p><div class="action-group"><button class="table-action" data-action="edit" data-id="${esc(survey.id)}">Edit</button><a class="table-action" href="../survey.html?id=${encodeURIComponent(survey.id)}">Preview</a><button class="table-action" data-action="toggle" data-id="${esc(survey.id)}">${survey.status === "Published" ? "Unpublish" : "Publish"}</button><button class="table-action danger" data-action="delete" data-id="${esc(survey.id)}">Delete</button></div></article>`).join("");
    };
    search?.addEventListener("input", renderList);
    statusFilter?.addEventListener("change", renderList);
    refreshButton?.addEventListener("click", async () => {
      refreshButton.disabled = true;
      listStatus.className = "status-text";
      listStatus.textContent = "Refreshing surveys…";
      try {
        await CommandoData.loadCloudContent(true);
        document.querySelector("#admin-cloud-warning")?.remove();
        listStatus.textContent = "Survey list is up to date.";
        renderList();
      } catch (error) {
        console.error("Survey list could not be refreshed:", error);
        listStatus.className = "status-text error";
        listStatus.textContent = `Could not refresh surveys: ${error.message}`;
      } finally {
        refreshButton.disabled = false;
      }
    });
    const renderBuilder = () => {
      builder.innerHTML = questions.map((question, index) => `<div class="builder-question" data-index="${index}"><label><span>Question</span><input data-field="text" value="${esc(question.text)}" required /></label><label><span>Type</span><select data-field="type">${["short", "email", "long", "multiple", "checkbox", "dropdown", "yesno", "rating", "number", "date"].map((type) => `<option value="${type}" ${question.type === type ? "selected" : ""}>${type}</option>`).join("")}</select></label><div class="action-group"><button class="table-action" type="button" data-move="-1" aria-label="Move question up">↑</button><button class="table-action" type="button" data-move="1" aria-label="Move question down">↓</button><button class="table-action danger" type="button" data-remove="${index}">Remove</button></div><label class="option-input"><span>Options (comma separated, if needed)</span><input data-field="options" value="${esc((question.options || []).join(", "))}" /></label><label class="required-toggle"><input type="checkbox" data-field="required" ${question.required ? "checked" : ""} /> Required</label></div>`).join("");
    };
    const blankQuestion = () => ({ id: `question-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, text: "", type: "short", required: false, options: [] });
    const defaultQuestions = () => [
      { id: "respondent-name", text: "Your name", type: "short", required: true, contactField: "name" },
      { id: "respondent-mobile", text: "Mobile number", type: "short", required: true, contactField: "mobile" },
      { id: "respondent-email", text: "Email address (optional)", type: "email", required: false, contactField: "email" },
      blankQuestion()
    ];
    const saveButton = form.querySelector('button[type="submit"]');
    const updateSaveLabel = () => {
      saveButton.textContent = form.elements.publish.checked ? "Publish survey" : "Save draft";
    };
    const openNew = () => {
      editing = null;
      questions = defaultQuestions();
      form.reset();
      form.elements.publish.checked = true;
      renderBuilder();
      modal.querySelector("h2").textContent = "Create survey";
      updateSaveLabel();
      modal.showModal();
    };
    form.elements.publish.addEventListener("change", updateSaveLabel);
    document.querySelector("#new-survey-btn").addEventListener("click", openNew);
    document.querySelector("#add-question-btn").addEventListener("click", () => { questions.push(blankQuestion()); renderBuilder(); });
    builder.addEventListener("input", (event) => {
      const row = event.target.closest(".builder-question");
      if (!row) return;
      const question = questions[Number(row.dataset.index)];
      const field = event.target.dataset.field;
      if (field === "required") question.required = event.target.checked;
      else if (field === "options") question.options = event.target.value.split(",").map((item) => item.trim()).filter(Boolean);
      else if (field) question[field] = event.target.value;
    });
    builder.addEventListener("change", (event) => {
      const row = event.target.closest(".builder-question");
      if (!row || !event.target.dataset.field) return;
      const field = event.target.dataset.field;
      if (field === "required") questions[Number(row.dataset.index)].required = event.target.checked;
      else questions[Number(row.dataset.index)][field] = event.target.value;
    });
    builder.addEventListener("click", (event) => {
      const remove = event.target.closest("[data-remove]");
      const move = event.target.closest("[data-move]");
      if (remove) questions.splice(Number(remove.dataset.remove), 1);
      if (move) {
        const row = move.closest(".builder-question");
        const from = Number(row.dataset.index);
        const to = from + Number(move.dataset.move);
        if (to >= 0 && to < questions.length) [questions[from], questions[to]] = [questions[to], questions[from]];
      }
      if (remove || move) renderBuilder();
    });
    root.addEventListener("click", async (event) => {
      const button = event.target.closest("[data-action]");
      if (!button) return;
      const survey = CommandoData.getSurveys().find((item) => item.id === button.dataset.id);
      if (!survey) return;
      try {
        if (button.dataset.action === "delete" && confirm(`Delete ${survey.title}?`)) {
          await CommandoData.deleteSurvey(survey.id);
          renderList();
        }
        if (button.dataset.action === "toggle") {
          await CommandoData.saveSurvey({ ...survey, status: survey.status === "Published" ? "Draft" : "Published" });
          renderList();
        }
      } catch (error) {
        CommandoUI.toast(`Could not save survey changes: ${error.message}`);
      }
      if (button.dataset.action === "edit") { editing = survey.id; questions = survey.questions.map((question) => ({ ...question })); form.elements.title.value = survey.title; form.elements.description.value = survey.description; form.elements.publish.checked = survey.status === "Published"; renderBuilder(); modal.querySelector("h2").textContent = "Edit survey"; updateSaveLabel(); modal.showModal(); }
    });
    document.addEventListener("click", (event) => { if (event.target.closest('[data-close-modal="survey-modal"]')) modal.close(); });
    form.addEventListener("submit", async (event) => {
      event.preventDefault(); if (!form.reportValidity()) return;
      const title = form.elements.title.value.trim();
      const description = form.elements.description.value.trim();
      const cleanQuestions = questions.map((question) => ({ ...question, text: question.text.trim() }));
      if (!cleanQuestions.length || cleanQuestions.some((question) => !question.text)) { CommandoUI.toast("Add at least one question and complete its text."); return; }
      try {
        await CommandoData.saveSurvey({ id: editing || undefined, title, description, questions: cleanQuestions, status: form.elements.publish.checked ? "Published" : "Draft", minutes: Math.max(1, Math.ceil(cleanQuestions.length * 0.7)) });
        modal.close(); renderList();
      } catch (error) {
        CommandoUI.toast(`Unable to save survey: ${error.message}`);
      }
    });
    renderList();
  });
})();
