import os
import json
from google import genai
from dotenv import load_dotenv

# Ensure environment variables are loaded
load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


def review_code(pr_title: str, pr_diff: str, repo_name: str, author: str) -> dict:
    prompt = f"""You are an expert code reviewer. Review this pull request.

Repository: {repo_name}
Author: {author}
PR Title: {pr_title}

Code Changes:
{pr_diff}

Respond ONLY with a valid JSON object, no markdown, no backticks:
{{
  "summary": "2-3 sentence summary of the changes",
  "verdict": "approve OR request_changes OR comment",
  "score": <number 1-10>
}}"""

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        response_text = response.text.strip()

        # Strip markdown code blocks if model ignores instructions
        if response_text.startswith("```"):
            lines = response_text.splitlines()
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].startswith("```"):
                lines = lines[:-1]
            response_text = "\n".join(lines).strip()

        return json.loads(response_text)
    except Exception as e:
        print("ERROR:", e)
        return {
            "summary": "Could not parse AI response",
            "verdict": "comment",
            "score": 0
        }