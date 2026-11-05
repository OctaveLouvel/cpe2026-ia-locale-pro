"""Ce que montre le tableau de bord : état des services, sauvegardes, connexions sortantes, versions installées.

Tout est lu sur la box : routes de santé des services (réseau interne), journaux JSON Lines de
sortie/journal/ (plateforme, assistant, et tout autre fichier *.jsonl ajouté par DEV-4), fichier compose.yaml
pour les versions. Aucune donnée du cabinet (fichiers, agenda, coffre-fort) n'est lue. Le journal d'audit
détaillé (questions posées, personnes) est la page de DEV-4, réservée aux administrateurs : https://ia.<domaine>/journal.
Le coffre-fort est sur un réseau à part : son état est lu par la page, à travers le reverse proxy (/etat/coffre).
"""
import json
import re
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta

from . import config

# ------------------------------------------------------------ services

SERVICES = [
    # (identifiant, nom affiché, adresse de santé sur le réseau interne, en-têtes)
    ("cloud", "Fichiers, agenda, contacts", config.NC_URL + "/status.php", {"Host": "nextcloud"}),
    ("assistant", "Assistant IA", config.ASSISTANT_URL + "/api/etat", {}),
    ("moteur", "Moteur d'IA local", config.MOTEUR_URL + "/api/version", {}),
]


def _lire_json(adresse, entetes):
    requete = urllib.request.Request(adresse, headers=entetes)
    with urllib.request.urlopen(requete, timeout=config.DELAI_SANTE) as reponse:
        corps = reponse.read()
    try:
        return json.loads(corps)
    except ValueError:
        return {}


def _sonder(service):
    identifiant, nom, adresse, entetes = service
    try:
        donnees = _lire_json(adresse, entetes)
    except Exception:  # service arrêté, en démarrage, ou nom introuvable : même affichage
        return {"id": identifiant, "nom": nom, "etat": "ko", "detail": "Ne répond pas"}
    if identifiant == "cloud":
        if donnees.get("maintenance"):
            return {"id": identifiant, "nom": nom, "etat": "attente", "detail": "En maintenance (sauvegarde en cours ?)"}
        return {"id": identifiant, "nom": nom, "etat": "ok" if donnees.get("installed") else "attente",
                "detail": f"Nextcloud {donnees.get('versionstring', '')}".strip()}
    if identifiant == "assistant":
        if not donnees.get("pret"):
            return {"id": identifiant, "nom": nom, "etat": "attente", "detail": donnees.get("message") or "Démarrage"}
        return {"id": identifiant, "nom": nom, "etat": "ok",
                "detail": f"{donnees.get('documents_indexes', 0)} documents indexés · modèle {donnees.get('modele')}"}
    if identifiant == "moteur":
        return {"id": identifiant, "nom": nom, "etat": "ok", "detail": f"Ollama {donnees.get('version', '')}".strip()}
    return {"id": identifiant, "nom": nom, "etat": "ok", "detail": "En service"}


def services():
    with ThreadPoolExecutor(len(SERVICES)) as groupe:
        return list(groupe.map(_sonder, SERVICES))


# ------------------------------------------------------------ journal

LIBELLES = {
    "question": "Question à l'assistant",
    "aucun_resultat": "Assistant : rien trouvé dans les documents autorisés",
    "refus_coffre": "Assistant : demande liée au coffre-fort refusée",
    "connexion": "Connexion",
    "deconnexion": "Déconnexion",
    "indexation": "Indexation des documents",
    "connexion_sortante": "Connexion sortante",
    "sauvegarde": "Sauvegarde chiffrée",
    "test_restauration": "Test de restauration",
    "restauration": "Restauration de la box",
    "installation": "Installation",
    "reinitialisation": "Réinitialisation",
    "donnees_demo": "Chargement des données fictives",
    "verification_hors_ligne": "Vérification hors ligne",
    "moteur_ia": "Moteur d'IA",
    "modele_ia": "Modèle d'IA",
    "juridique": "Pack juridique",
}
SOURCES = {"plateforme": "Box", "installeur": "Installation", "assistant": "Assistant IA",
           "tableau-de-bord": "Tableau de bord", "juridique": "Pack juridique"}


def _date(texte):
    try:
        return datetime.fromisoformat(texte).astimezone(config.PARIS)
    except (TypeError, ValueError):
        return None


def _detail(evenement):
    """Détail lisible d'un événement. Les chemins de fichiers de la box ne sont pas affichés."""
    detail = evenement.get("detail")
    if isinstance(detail, str):
        return re.sub(r" dans /\S+", "", detail)
    if not isinstance(detail, dict):
        return ""
    morceaux = []
    if detail.get("question"):
        morceaux.append(f"« {detail['question']} »")
    if detail.get("sources"):
        morceaux.append(f"{len(detail['sources'])} source(s) citée(s)")
    if detail.get("duree_s"):
        morceaux.append(f"réponse en {detail['duree_s']:.0f} s")
    if detail.get("action"):
        morceaux.append(" ".join(str(detail[c]) for c in ("action", "modele") if detail.get(c)))
    if detail.get("depuis"):
        morceaux.append(f"depuis {detail['depuis']}")
    if detail.get("erreur"):
        morceaux.append(f"erreur : {detail['erreur']}")
    if "documents_indexes" in detail:
        morceaux.append(f"{detail['documents_indexes']} documents")
    if detail.get("motif"):
        morceaux.append(detail["motif"])
    if detail.get("ip"):
        morceaux.append(f"poste {detail['ip']}")
    return " · ".join(morceaux)


def evenements():
    """Tous les événements des journaux, du plus ancien au plus récent. Une ligne illisible est ignorée."""
    liste = []
    for fichier in sorted(config.JOURNAUX.glob("*.jsonl")):
        try:
            lignes = fichier.read_text(encoding="utf-8").splitlines()
        except OSError:
            continue
        for ligne in lignes:
            try:
                brut = json.loads(ligne)
            except ValueError:
                continue
            date = _date(brut.get("date"))
            if date is None:
                continue
            type_evenement = str(brut.get("type", ""))
            liste.append({
                "date": date,
                "source": SOURCES.get(brut.get("source"), brut.get("source", "")),
                "type": type_evenement,
                "libelle": LIBELLES.get(type_evenement, type_evenement.replace("_", " ").capitalize()),
                "utilisateur": brut.get("utilisateur") or "",
                "detail": _detail(brut),
                "resultat": str(brut.get("resultat", "")),
            })
    liste.sort(key=lambda e: e["date"])
    return liste


def _public(evenement):
    return {**evenement, "date": evenement["date"].isoformat(timespec="seconds")}


# ------------------------------------------------------------ résumé

def _dernier(liste, *types, resultat=None):
    for evenement in reversed(liste):
        if evenement["type"] in types and (resultat is None or evenement["resultat"] == resultat):
            return evenement
    return None


def resume():
    liste = evenements()
    maintenant = datetime.now(config.PARIS)

    sauvegarde = _dernier(liste, "sauvegarde")
    reussie = _dernier(liste, "sauvegarde", resultat="ok")
    if reussie is None:
        etat_sauvegarde = "ko"
    elif maintenant - reussie["date"] > timedelta(hours=config.SAUVEGARDE_MAX_HEURES):
        etat_sauvegarde = "attente"
    else:
        etat_sauvegarde = "ok" if sauvegarde is reussie else "attente"

    # Une connexion sortante s'inscrit au début (« en_cours ») puis à la fin : on compte les débuts.
    sorties = [e for e in liste if e["type"] == "connexion_sortante"]
    debuts = [e for e in sorties if e["resultat"] == "en_cours"] or sorties
    depuis = maintenant - timedelta(days=30)

    installation = _dernier(liste, "installation", "restauration")
    return {
        "maintenant": maintenant.isoformat(timespec="seconds"),
        "services": services(),
        "sauvegarde": {
            "etat": etat_sauvegarde,
            "derniere": _public(sauvegarde) if sauvegarde else None,
            "derniere_reussie": _public(reussie) if reussie else None,
            "test_restauration": _public(t) if (t := _dernier(liste, "test_restauration", "restauration")) else None,
            "nombre": sum(1 for e in liste if e["type"] == "sauvegarde" and e["resultat"] == "ok"),
        },
        "sorties": {
            "trente_jours": sum(1 for e in debuts if e["date"] >= depuis),
            "derniere": _public(sorties[-1]) if sorties else None,
        },
        "verification": _public(v) if (v := _dernier(liste, "verification_hors_ligne")) else None,
        "installation": _public(installation) if installation else None,
        "versions": versions(),
    }


# ------------------------------------------------------------ versions

NOMS_IMAGES = {
    "box/nextcloud": "Nextcloud (fichiers, agenda, contacts)",
    "vaultwarden/server": "Vaultwarden (coffre-fort)",
    "caddy": "Caddy (connexions chiffrées)",
    "postgres": "PostgreSQL (base de données)",
    "valkey/valkey": "Valkey (cache)",
    "ollama/ollama": "Ollama (moteur d'IA)",
    "box/assistant": "Assistant IA du cabinet",
    "restic/restic": "restic (sauvegarde chiffrée)",
}


def versions():
    """Versions figées dans compose.yaml : ce qui tourne est exactement ce qui y est écrit."""
    try:
        texte = config.COMPOSE.read_text(encoding="utf-8")
    except OSError:
        return []
    vues, liste = set(), []
    for image in re.findall(r"^\s*image:\s*(\S+)", texte, re.M):
        nom, _, version = image.partition(":")
        if nom in NOMS_IMAGES and nom not in vues:
            vues.add(nom)
            liste.append({"nom": NOMS_IMAGES[nom], "version": version.removesuffix("-alpine")})
    return liste
