import fitz
from .skills import JOB_SKILLS


def extract_text_from_pdf(pdf_path):
    doc = fitz.open(pdf_path)
    text = ""

    for page in doc:
        text += page.get_text()

    doc.close()
    return text


def calculate_ats_score(text, job_role):
    text = text.lower()

    skills = JOB_SKILLS.get(job_role, [])

    matched_skills = []
    missing_skills = []

    for skill in skills:
        if skill.lower() in text:
            matched_skills.append(skill)
        else:
            missing_skills.append(skill)

    score = int((len(matched_skills) / len(skills)) * 100) if skills else 0

    suggestions = []

    if score >= 80:
        suggestions.append("Excellent resume for this role.")
    elif score >= 60:
        suggestions.append("Good resume, but you can improve by adding missing skills.")
    else:
        suggestions.append("Your resume needs improvement for this job role.")

    for skill in missing_skills[:5]:
        suggestions.append(f"Consider adding '{skill}' if you have experience with it.")

    return {
        "score": score,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "suggestions": suggestions,
    }