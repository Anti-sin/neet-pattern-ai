const generateBtn = document.getElementById("generateBtn");
const clearBtn = document.getElementById("clearBtn");
const loading = document.getElementById("loading");
const outputDiv = document.getElementById("output");
const difficultyEl = document.getElementById("difficulty");

// Answer panel
const userAnswerEl = document.getElementById("userAnswer");
const userAnswerEmpty = document.getElementById("userAnswerEmpty");
const copyAnswerTextBtn = document.getElementById("copyAnswerText");

// Similar panel
const similarList = document.getElementById("similarList");
const similarEmpty = document.getElementById("similarEmpty");
const copySimilarBtn = document.getElementById("copySimilar");

// MCQ panel
const generatedQuestion = document.getElementById("generatedQuestion");
const generatedAnswer = document.getElementById("generatedAnswer");
const generatedExplanation = document.getElementById("generatedExplanation");
const submitAnswerBtn = document.getElementById("submitAnswer");
const solutionBtn = document.getElementById("showSolution");
const solutionContainer = document.getElementById("solutionContainer");
const copyMCQBtn = document.getElementById("copyMCQ");

let correctAnswer = "";

// Call Gemini API through backend
async function callGemini(prompt) {
  const response = await fetch("/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  if (!response.ok) throw new Error("Network error");
  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

function setLoading(isLoading) {
  generateBtn.disabled = isLoading;
  loading.classList.toggle("hidden", !isLoading);
}

function renderAnswer(text) {
  if (text && String(text).trim()) {
    userAnswerEl.textContent = text.trim();
    userAnswerEmpty.style.display = "none";
  } else {
    userAnswerEl.textContent = "";
    userAnswerEmpty.style.display = "";
  }
}

function renderSimilar(arr) {
  similarList.innerHTML = "";
  if (Array.isArray(arr) && arr.length) {
    arr.forEach((q) => {
      const li = document.createElement("li");
      li.textContent = q;
      similarList.appendChild(li);
    });
    similarEmpty.style.display = "none";
  } else if (typeof arr === "string" && arr.trim()) {
    const li = document.createElement("li");
    li.textContent = arr.trim();
    similarList.appendChild(li);
    similarEmpty.style.display = "none";
  } else {
    similarEmpty.style.display = "";
  }
}

function renderMCQ(mcq) {
  generatedQuestion.textContent = mcq?.question || "";

  document.getElementById("optionA").textContent = mcq?.options?.A || "—";
  document.getElementById("optionB").textContent = mcq?.options?.B || "—";
  document.getElementById("optionC").textContent = mcq?.options?.C || "—";
  document.getElementById("optionD").textContent = mcq?.options?.D || "—";

  correctAnswer = mcq?.answer || "";
  generatedAnswer.textContent = correctAnswer ? "Answer: " + correctAnswer : "";
  generatedExplanation.textContent = mcq?.explanation
    ? "Explanation: " + mcq.explanation
    : "";

  // Lock solution on new generation
  solutionBtn.disabled = true;
  solutionBtn.classList.add("cursor-not-allowed");
  solutionContainer.classList.add("hidden");

  // Reset choice
  document
    .querySelectorAll('input[name="answer"]')
    .forEach((r) => (r.checked = false));
}

function solidToast(msg) {
  // simple toast using alert for now, non-blocking could be added later
  console.log(msg);
}

// Generate
generateBtn.addEventListener("click", async () => {
  const input = document.getElementById("question").value.trim();
  if (!input) {
    alert("Please paste a question first.");
    return;
  }
  const difficulty = difficultyEl.value;

  const prompt = `
You are PatternAI: an expert assistant. For the user's question, return STRICT JSON with three keys:
1) "answer": a crisp, correct explanation/answer to the user's original question (max ~10 lines).
2) "similar": an string of (or at most 2 )  — one new practice question in the same pattern, slightly harder than the original.
3) "mcq": a single, slightly ${difficulty} MCQ based on the same pattern with fields:
   { "question": string, "options": { "A": string, "B": string, "C": string, "D": string }, "answer": "A|B|C|D", "explanation": string }.

Do NOT include any markdown code fences. Output only valid JSON.

User Question:
${input}
`;

  setLoading(true);
  try {
    let aiResponse = await callGemini(prompt);
    aiResponse = aiResponse.replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(aiResponse);
    } catch (e) {
      // fallback: place raw text into answer and leave others empty
      parsed = {
        answer: aiResponse,
        similar: [],
        mcq: { question: "", options: {}, answer: "", explanation: "" },
      };
    }

    outputDiv.classList.remove("hidden");

    renderAnswer(parsed.answer);
    renderSimilar(parsed.similar);
    renderMCQ(parsed.mcq || {});
  } catch (err) {
    console.error(err);
    outputDiv.classList.remove("hidden");
    renderAnswer("Something went wrong. Please try again.");
    renderSimilar([]);
    renderMCQ({});
  } finally {
    setLoading(false);
  }
});

// Submit Answer
submitAnswerBtn.addEventListener("click", () => {
  const userAnswer = document.querySelector('input[name="answer"]:checked');
  if (!userAnswer) {
    alert("Please select an answer first.");
    return;
  }

  if (userAnswer.value === correctAnswer) {
    alert("✅ Correct!");
  } else {
    alert("❌ Incorrect! Try again or view the solution.");
  }

  // Unlock solution
  solutionBtn.disabled = false;
  solutionBtn.classList.remove("cursor-not-allowed");
});

// Show Solution
solutionBtn.addEventListener("click", () => {
  solutionContainer.classList.toggle("hidden");
});

// Copy buttons
copyAnswerTextBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(userAnswerEl.textContent || "");
  } catch (_) {}
});

copySimilarBtn.addEventListener("click", async () => {
  try {
    const text = Array.from(similarList.querySelectorAll("li"))
      .map((li) => li.textContent)
      .join("\n");
    await navigator.clipboard.writeText(text);
  } catch (_) {}
});

copyMCQBtn.addEventListener("click", async () => {
  const q = generatedQuestion.textContent || "";
  const A = document.getElementById("optionA").textContent;
  const B = document.getElementById("optionB").textContent;
  const C = document.getElementById("optionC").textContent;
  const D = document.getElementById("optionD").textContent;
  const ans = generatedAnswer.textContent || "";
  const exp = generatedExplanation.textContent || "";
  const blob = `${q}\nA) ${A}\nB) ${B}\nC) ${C}\nD) ${D}\n${ans}\n${exp}`;
  try {
    await navigator.clipboard.writeText(blob);
  } catch (_) {}
});

// Clear
clearBtn.addEventListener("click", () => {
  document.getElementById("question").value = "";
  userAnswerEl.textContent = "";
  userAnswerEmpty.style.display = "";
  similarList.innerHTML = "";
  similarEmpty.style.display = "";
  generatedQuestion.textContent = "";
  ["A", "B", "C", "D"].forEach(
    (k) => (document.getElementById("option" + k).textContent = "—")
  );
  generatedAnswer.textContent = "";
  generatedExplanation.textContent = "";
  solutionContainer.classList.add("hidden");
  outputDiv.classList.add("hidden");
});
