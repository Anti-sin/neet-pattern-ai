const generateBtn = document.getElementById("generateBtn");
const outputDiv = document.getElementById("output");
const generatedQuestion = document.getElementById("generatedQuestion");
const generatedAnswer = document.getElementById("generatedAnswer");
const generatedExplanation = document.getElementById("generatedExplanation");
const submitAnswerBtn = document.getElementById("submitAnswer");
const solutionBtn = document.getElementById("showSolution");
const solutionContainer = document.getElementById("solutionContainer");

let correctAnswer = "";

// Call Gemini API through backend
async function callGemini(prompt) {
  const response = await fetch("/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

// Generate Question
generateBtn.addEventListener("click", async () => {
  const input = document.getElementById("question").value.trim();
  if (!input) {
    alert("Please paste a NEET question first.");
    return;
  }

  const prompt = `
You are an expert all knowing being who understand and breakdowns concept properly.
Take the following question and generate a similar style question with slightly more difficulty but similar pattern.
Also provide 4 answer options (A, B, C, D), the correct answer letter, and an explanation in JSON format.

Question: ${input}

Return JSON like this:
{
  "question": "...",
  "options": {
    "A": "...",
    "B": "...",
    "C": "...",
    "D": "..."
  },
  "answer": "B",
  "explanation": "..."
}
`;

  let aiResponse = await callGemini(prompt);
  aiResponse = aiResponse.replace(/```json|```/g, "").trim();

  try {
    const parsed = JSON.parse(aiResponse);

    outputDiv.classList.remove("hidden");
    generatedQuestion.innerText = parsed.question;

    // Update options
    document.getElementById("optionA").innerText = parsed.options.A;
    document.getElementById("optionB").innerText = parsed.options.B;
    document.getElementById("optionC").innerText = parsed.options.C;
    document.getElementById("optionD").innerText = parsed.options.D;

    correctAnswer = parsed.answer;
    generatedAnswer.innerText = "Answer: " + parsed.answer;
    generatedExplanation.innerText = "Explanation: " + parsed.explanation;

    // Lock solution
    solutionBtn.disabled = true;
    solutionBtn.classList.add("cursor-not-allowed");
    solutionContainer.classList.add("hidden");

    // Reset selections
    document
      .querySelectorAll('input[name="answer"]')
      .forEach((r) => (r.checked = false));
  } catch (e) {
    generatedQuestion.innerText =
      "⚠️ Error parsing AI response. Try again.\n\n" + aiResponse;
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
    alert("❌ Incorrect! Try again or unlock solution.");
  }

  // Unlock solution
  solutionBtn.disabled = false;
  solutionBtn.classList.remove("cursor-not-allowed");
});

// Show Solution
solutionBtn.addEventListener("click", () => {
  solutionContainer.classList.toggle("hidden");
});
