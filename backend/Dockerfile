FROM python:3.11-slim

# Set up a new user named "user" with user ID 1000
RUN useradd -m -u 1000 user

# Set the working directory
WORKDIR /app

# Install system dependencies (required for some python packages like matplotlib/scikit-learn)
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY --chown=user:user requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY --chown=user:user . .

# Switch to the non-root user
USER user

# Set environment variables
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    PYTHONUNBUFFERED=1

# Expose the default HuggingFace Space port
EXPOSE 7860

# Command to run the FastAPI application using Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
