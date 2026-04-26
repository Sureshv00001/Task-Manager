const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const getModel = () => {
  return genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
};

// Retry wrapper for rate-limited requests
const withRetry = async (fn, retries = 2) => {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.message?.includes('429') && i < retries) {
        const delay = (i + 1) * 2000; // 2s, 4s
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw error;
    }
  }
};

// Generate task description and checklist from a title
const generateTaskContent = async (title) => {
  const model = getModel();
  const prompt = `You are a project management AI assistant. Given this task title: "${title}"

Generate the following in JSON format (no markdown, just raw JSON):
{
  "description": "A professional, detailed 2-3 sentence description of this task in HTML format using <p> tags",
  "checklists": ["Step 1 text", "Step 2 text", "Step 3 text", "Step 4 text", "Step 5 text"],
  "suggestedPriority": "low|medium|high",
  "estimatedHours": number
}

Rules:
- Description should be in HTML with <p> tags, professional and clear
- Checklists should have 4-6 actionable steps
- Priority should be based on the nature of the task
- Estimated hours should be realistic
- Return ONLY valid JSON, no markdown code fences`;

  const result = await withRetry(() => model.generateContent(prompt));
  const text = result.response.text().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(text);
};

// Summarize a project's status
const summarizeProject = async (project) => {
  const model = getModel();
  const prompt = `You are a project management AI assistant. Summarize this project status in exactly 2-3 sentences for a manager:

Project: "${project.name}"
Description: "${project.description}"
Status: ${project.status}
Deadline: ${project.deadline}
Total Tasks: ${project.taskCount}
Completed Tasks: ${project.completedCount}
Progress: ${project.progress}%
Team Members: ${project.members?.map(m => m.name).join(', ') || 'None assigned'}

Task Breakdown:
${project.tasks?.map(t => `- "${t.title}" [${t.status}] (Priority: ${t.priority})`).join('\n') || 'No tasks yet'}

Write a concise executive summary paragraph. Be direct and highlight any concerns. Return plain text only, no markdown.`;

  const result = await withRetry(() => model.generateContent(prompt));
  return result.response.text().trim();
};

// Analyze risk for tasks
const analyzeRisks = async (tasks) => {
  const model = getModel();
  
  const taskData = tasks.map(t => ({
    title: t.title,
    status: t.status,
    priority: t.priority,
    deadline: t.deadline,
    totalTimeSpent: t.totalTimeSpent || 0,
    isTimerRunning: t.isTimerRunning,
    assignedTo: t.assignedTo?.name,
    daysLeft: Math.ceil((new Date(t.deadline) - new Date()) / (1000 * 60 * 60 * 24)),
    createdAt: t.createdAt
  }));

  const prompt = `You are a project risk analysis AI. Analyze these tasks and identify which ones are at risk of missing their deadline.

Tasks:
${JSON.stringify(taskData, null, 2)}

Return a JSON array of risk alerts (only for tasks that are genuinely at risk). Format:
[
  {
    "taskTitle": "exact task title",
    "riskLevel": "high|medium|low",
    "reason": "Brief 1-sentence reason why this task is at risk",
    "suggestion": "Brief 1-sentence actionable suggestion"
  }
]

Rules:
- A task is HIGH risk if: deadline is within 2 days AND status is pending/in-progress
- A task is MEDIUM risk if: deadline is within 5 days AND status is pending, OR very little time has been logged relative to estimated complexity
- A task is LOW risk if: it's slightly behind schedule but recoverable
- Skip completed/reviewed tasks entirely
- If no tasks are at risk, return an empty array []
- Return ONLY valid JSON, no markdown code fences`;

  const result = await withRetry(() => model.generateContent(prompt));
  const text = result.response.text().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(text);
};

module.exports = { generateTaskContent, summarizeProject, analyzeRisks };
