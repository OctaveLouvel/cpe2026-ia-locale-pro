# Assistant IA de la box (DEV-2). Les dépendances sont installées à la construction de l'image, en
# atelier : ensuite le service fonctionne sans internet, sur le réseau interne de la box.
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY assistant/ assistant/
COPY modeles.json modeles.json

EXPOSE 8000
CMD ["python", "-m", "assistant"]
