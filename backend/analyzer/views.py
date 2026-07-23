from django.http import JsonResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .serializers import ResumeSerializer
from .utils import extract_text_from_pdf, calculate_ats_score

def home(request):
    return JsonResponse({
        "message": "Welcome to AI Resume Analyzer API"
    })

@api_view(['POST'])
def upload_resume(request):
    serializer = ResumeSerializer(data=request.data)
    
    if serializer.is_valid():
        resume = serializer.save()
        
        text = extract_text_from_pdf(resume.resume.path)
        print(text)
        
        job_role = request.data.get("job_role", "Python Developer")
        
        ats_result = calculate_ats_score(text, job_role)
                
        return Response({
            "message": "Resume uploaded successfully",
            
            "job_role": job_role,
            
            "text": text,
            
            "ats_score": ats_result["score"],
            
            "matched_skills": ats_result["matched_skills"],
            
            "missing_skills": ats_result["missing_skills"],
            
            "suggestions": ats_result["suggestions"],
            
            "summary": {
                "matched": len(ats_result["matched_skills"]),
                "missing": len(ats_result["missing_skills"]),
                "total": len(ats_result["matched_skills"]) + len(ats_result["missing_skills"])
            }
        })
    
    return Response(serializer.errors)

    