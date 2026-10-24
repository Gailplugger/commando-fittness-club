(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", async () => {
    if (!(await window.CommandoAdminReady)) return;
    const table = document.querySelector("#response-summary");
    const detail = document.querySelector("#response-detail");
    const exportButton = document.querySelector("#export-responses");
    const count = document.querySelector("#response-count");
    const status = document.querySelector("#response-status");
    const refreshButton = document.querySelector("#refresh-responses");
    if (!table || !detail) return;
    const esc = CommandoUI.escapeHtml;
    const surveys = CommandoData.getSurveys();
    let responses = [];

    const surveyFor = (response) => surveys.find((survey) => survey.id === response.surveyId);
    const answerFor = (response, field) => {
      const question = surveyFor(response)?.questions.find((item) => item.contactField === field);
      return question ? response.answers?.[question.id] || "" : "";
    };
    const textAnswer = (answer) => Array.isArray(answer) ? answer.join(", ") : String(answer ?? "");
    const dateFor = (response) => response.submittedAt || response.date || "";
    const csvCell = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const answerHeaders = [...new Set(surveys.flatMap((survey) => survey.questions.filter((question) => !question.contactField).map((question) => question.text)))];
    const rowsForExport = () => responses.map((response) => {
      const survey = surveyFor(response);
      const answerMap = new Map((survey?.questions || []).map((question) => [question.text, textAnswer(response.answers?.[question.id])]));
      return [dateFor(response), response.surveyTitle || survey?.title || "", textAnswer(answerFor(response, "name")), textAnswer(answerFor(response, "mobile")), textAnswer(answerFor(response, "email")), ...answerHeaders.map((header) => answerMap.get(header) || "")];
    });
    const exportCsv = () => {
      const csv = [["Date", "Survey", "Name", "Mobile number", "Email", ...answerHeaders], ...rowsForExport()].map((row) => row.map(csvCell).join(",")).join("\r\n");
      const url = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `commando-survey-responses-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    };
    const renderResponses = (localOnly = false) => {
      count.textContent = localOnly
        ? responses.length ? `${responses.length} local backup response${responses.length === 1 ? "" : "s"}` : "Responses unavailable"
        : `${responses.length} response${responses.length === 1 ? "" : "s"}`;
      if (exportButton) exportButton.disabled = !responses.length;
      table.innerHTML = responses.length ? responses.map((response, index) => {
        const survey = surveyFor(response);
        return `<tr><td data-label="Date">${esc(dateFor(response).slice(0, 10) || "—")}</td><td data-label="Survey">${esc(response.surveyTitle || survey?.title || "Unknown survey")}</td><td data-label="Name">${esc(textAnswer(answerFor(response, "name")) || "—")}</td><td data-label="Mobile">${esc(textAnswer(answerFor(response, "mobile")) || "—")}</td><td data-label="Email">${esc(textAnswer(answerFor(response, "email")) || "—")}</td><td data-label="Action"><button class="table-action" data-view-response="${index}">View answers</button></td></tr>`;
      }).join("") : `<tr><td colspan="6">${localOnly ? "Could not load cloud responses. Check Firestore permissions and refresh." : "No survey responses yet."}</td></tr>`;
    };
    const loadResponses = async () => {
      refreshButton && (refreshButton.disabled = true);
      status.className = "status-text";
      status.textContent = "Loading responses…";
      try {
        await CommandoData.loadSurveyResponses();
        responses = CommandoData.getSurveyResponses();
        status.textContent = "";
        renderResponses();
      } catch (error) {
        console.error("Survey responses could not be loaded from Firestore:", error);
        responses = CommandoData.getSurveyResponses();
        status.className = "status-text error";
        status.textContent = `Firestore could not load responses (${error.code || error.message}). Publish the current firestore.rules in Firebase Console to allow admin reads. Showing this browser’s local backup only.`;
        renderResponses(true);
      } finally {
        if (refreshButton) refreshButton.disabled = false;
      }
    };
    refreshButton?.addEventListener("click", loadResponses);
    exportButton?.addEventListener("click", exportCsv);
    table.addEventListener("click", (event) => {
      const button = event.target.closest("[data-view-response]");
      if (!button) return;
      const response = responses[Number(button.dataset.viewResponse)];
      const survey = surveyFor(response);
      detail.classList.remove("hidden");
      detail.innerHTML = `<h2>${esc(response.surveyTitle || survey?.title || "Survey response")}</h2><p class="form-help">Submitted ${esc(dateFor(response))}</p>${Object.entries(response.answers || {}).map(([questionId, answer]) => { const question = survey?.questions.find((item) => item.id === questionId); return `<div class="response-answer"><strong>${esc(question?.text || questionId)}</strong><span>${esc(textAnswer(answer) || "—")}</span></div>`; }).join("")}`;
      detail.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    await loadResponses();
  });
})();
