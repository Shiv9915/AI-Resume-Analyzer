from django.db import models

# Create your models here.

class Resume(models.Model):
    resume = models.FileField(upload_to='resumes/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    