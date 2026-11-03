# Routes des autres services

Chaque équipe ajoute ici un fichier `<service>.caddy` pour exposer son service derrière le reverse proxy TLS. Exemple pour l'assistant IA (DEV-2), si son conteneur s'appelle `assistant` et écoute sur le port 8000 :

```
ia.{$BOX_DOMAIN} {
	import entetes
	reverse_proxy assistant:8000
}
```

Le conteneur doit être sur le réseau `interne` de [`../../compose.yaml`](../../compose.yaml) (aucun accès à internet). Après un ajout : `docker compose restart proxy`.
