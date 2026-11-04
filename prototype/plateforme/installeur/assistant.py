#!/usr/bin/env python3
"""Assistant de première configuration de la box (« installeur »), en quelques écrans.

    ./box.sh assistant              écoute sur 127.0.0.1:8090
    ./box.sh assistant 0.0.0.0      écoute sur le réseau du cabinet (premier démarrage chez le client)

Écrans : 1. état de la box  2. cabinet et compte administrateur  3. services
         4. chiffrement et sauvegarde  5. fiche de secours.

Python 3.11+ et bibliothèque standard uniquement : rien à télécharger, fonctionne hors ligne.
L'accès est protégé par un jeton à usage local, affiché dans le terminal au lancement.
"""
import html
import json
import os
import re
import secrets
import subprocess
import sys
import threading
import urllib.parse
from datetime import datetime
from http import cookies
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

PLATEFORME = Path(__file__).resolve().parent.parent
ENV = PLATEFORME / ".env"
SORTIE = PLATEFORME / "sortie"
ETAT = SORTIE / "installation.json"
JETON = secrets.token_urlsafe(24)
ANSI = re.compile(r"\x1b\[[0-9;]*m")
ETAPES = ["État de la box", "Cabinet", "Services", "Sécurité", "Fiche de secours"]
TACHES = {}


# ---------------------------------------------------------------- outils

def lire_env():
    valeurs = {}
    for ligne in ENV.read_text(encoding="utf-8").splitlines():
        if "=" in ligne and not ligne.lstrip().startswith("#"):
            cle, _, valeur = ligne.partition("=")
            valeurs[cle.strip()] = valeur.strip().strip('"')
    return valeurs


def ecrire_env(cle, valeur):
    if any(c in valeur for c in '"\n\\$`'):
        raise ValueError("caractère non autorisé")
    lignes = ENV.read_text(encoding="utf-8").splitlines()
    nouvelle = f'{cle}="{valeur}"'  # toujours entre guillemets : lu par bash et par docker compose
    for i, ligne in enumerate(lignes):
        if ligne.startswith(f"{cle}="):
            lignes[i] = nouvelle
            break
    else:
        lignes.append(nouvelle)
    ENV.write_text("\n".join(lignes) + "\n", encoding="utf-8")


def lire_etat():
    return json.loads(ETAT.read_text(encoding="utf-8")) if ETAT.exists() else {}


def ecrire_etat(**valeurs):
    etat = lire_etat() | valeurs
    SORTIE.mkdir(exist_ok=True)
    ETAT.write_text(json.dumps(etat, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def journal(type_evenement, detail, resultat="ok"):
    chemin = SORTIE / "journal" / "evenements.jsonl"
    chemin.parent.mkdir(parents=True, exist_ok=True)
    with chemin.open("a", encoding="utf-8") as f:
        f.write(json.dumps({"date": datetime.now().astimezone().isoformat(timespec="seconds"),
                            "source": "installeur", "type": type_evenement, "detail": detail,
                            "resultat": resultat}, ensure_ascii=False) + "\n")


def lancer(*commande, entree=None):
    resultat = subprocess.run(commande, cwd=PLATEFORME, capture_output=True, text=True, input=entree)
    return resultat.returncode, ANSI.sub("", resultat.stdout + resultat.stderr).strip()


def occ(*arguments, env=None):
    commande = ["docker", "compose", "exec", "-T", "-u", "www-data"]
    for cle, valeur in (env or {}).items():
        commande += ["-e", f"{cle}={valeur}"]
    return lancer(*commande, "nextcloud", "php", "occ", *arguments)


def services_demarres():
    code, sortie = lancer("docker", "compose", "ps", "--format", "{{.Service}} {{.Health}} {{.State}}")
    etats = {}
    for ligne in sortie.splitlines():
        morceaux = ligne.split()
        if morceaux:
            etats[morceaux[0]] = morceaux[-1] if len(morceaux) == 2 else morceaux[1] or morceaux[-1]
    return etats


def connecte_a_internet():
    code, sortie = lancer("ip", "route", "show", "default")
    return code == 0 and bool(sortie)


def chiffrement_disque():
    """Le disque qui porte les données de Docker est-il chiffré (LUKS) ?"""
    code, racine = lancer("docker", "info", "-f", "{{.DockerRootDir}}")
    racine = racine if code == 0 and racine else "/var/lib/docker"
    code, source = lancer("findmnt", "-no", "SOURCE", "--target", racine)
    if code != 0 or not source:
        return None, "impossible de déterminer le disque"
    source = source.split("[")[0]
    code, types = lancer("lsblk", "-s", "-no", "TYPE", source)
    if code != 0:
        return None, source
    return "crypt" in types.split(), source


def disques_usb():
    code, sortie = lancer("lsblk", "-J", "-o", "NAME,TRAN,SIZE,MOUNTPOINT,LABEL")
    if code != 0:
        return []
    trouves = []

    def parcourir(appareils, usb=False):
        for a in appareils:
            est_usb = usb or a.get("tran") == "usb"
            if est_usb and a.get("mountpoint"):
                trouves.append((a["mountpoint"], f'{a.get("label") or a["name"]} ({a["size"]})'))
            parcourir(a.get("children", []), est_usb)

    parcourir(json.loads(sortie).get("blockdevices", []))
    return trouves


def empreinte_certificat():
    certificat = SORTIE / "autorite-locale.crt"
    if not certificat.exists():
        lancer("./box.sh", "certificat")
    code, sortie = lancer("openssl", "x509", "-in", str(certificat), "-noout", "-fingerprint", "-sha256")
    return sortie.split("=", 1)[1] if code == 0 and "=" in sortie else "indisponible"


def demarrer_tache(nom, *commande):
    identifiant = secrets.token_hex(6)
    tache = {"nom": nom, "journal": "", "fini": False, "ok": False}
    TACHES[identifiant] = tache

    def executer():
        processus = subprocess.Popen(commande, cwd=PLATEFORME, stdout=subprocess.PIPE,
                                     stderr=subprocess.STDOUT, text=True)
        for ligne in processus.stdout:
            tache["journal"] += ANSI.sub("", ligne)
        tache["ok"] = processus.wait() == 0
        tache["fini"] = True

    threading.Thread(target=executer, daemon=True).start()
    return identifiant


# ---------------------------------------------------------------- pages

STYLE = """
:root{--fond:#f4f6f8;--carte:#fff;--texte:#1b2430;--doux:#5b6675;--accent:#1d3557;--bord:#d9dee5;--ok:#1e7a46;--ko:#b23a48;--attention:#9a6700}
@media (prefers-color-scheme:dark){:root{--fond:#11161d;--carte:#1a212b;--texte:#e6eaf0;--doux:#9aa5b4;--accent:#8fb3e8;--bord:#2c3542;--ok:#5cc28a;--ko:#ef8a96;--attention:#e3b341}}
*{box-sizing:border-box}body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;background:var(--fond);color:var(--texte);line-height:1.5}
main{max-width:760px;margin:0 auto;padding:32px 16px 64px}h1{font-size:1.5rem;margin:0 0 4px}h2{font-size:1.15rem;margin:0 0 12px}
.sous-titre{color:var(--doux);margin:0 0 24px}.etapes{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 24px;padding:0;list-style:none;font-size:.85rem}
.etapes li{padding:4px 10px;border-radius:999px;border:1px solid var(--bord);color:var(--doux)}.etapes li.active{border-color:var(--accent);color:var(--accent);font-weight:600}
.carte{background:var(--carte);border:1px solid var(--bord);border-radius:10px;padding:24px;margin-bottom:16px}
label{display:block;font-weight:600;margin:14px 0 4px}input[type=text],input[type=email],input[type=password]{width:100%;padding:9px 10px;border:1px solid var(--bord);border-radius:6px;background:var(--fond);color:var(--texte);font:inherit}
.aide{color:var(--doux);font-size:.9rem;margin:4px 0 0}.choix{display:flex;gap:10px;align-items:flex-start;margin:12px 0;font-weight:400}.choix input{margin-top:5px}
button,.bouton{display:inline-block;margin-top:20px;padding:10px 18px;border:0;border-radius:6px;background:var(--accent);color:var(--carte);font:inherit;font-weight:600;cursor:pointer;text-decoration:none}
button.secondaire{background:transparent;color:var(--accent);border:1px solid var(--accent)}
.ok{color:var(--ok)}.ko{color:var(--ko)}.attention{color:var(--attention)}ul.etat{list-style:none;padding:0;margin:0}ul.etat li{padding:6px 0;border-bottom:1px solid var(--bord)}
pre{background:var(--fond);border:1px solid var(--bord);border-radius:6px;padding:12px;max-height:320px;overflow:auto;font-size:.8rem;white-space:pre-wrap}
.erreur{border-left:4px solid var(--ko);padding:8px 12px;background:var(--fond);margin-bottom:12px}
.fiche td{padding:6px 12px 6px 0;vertical-align:top}code{word-break:break-all}
@media print{.etapes,button,.bouton,.pas-imprimer{display:none}body{background:#fff}.carte{border:0}}
"""

SUIVI = """<script>
async function suivre(id){const r=await fetch('/tache/'+id);const t=await r.json();
const j=document.getElementById('journal');j.textContent=t.journal;j.scrollTop=j.scrollHeight;
if(!t.fini){setTimeout(()=>suivre(id),1000);return}
document.getElementById('resultat').innerHTML=t.ok?'<p class="ok">Terminé avec succès.</p>':'<p class="ko">Échec : voir le journal ci-dessus.</p>';
document.getElementById('suite').hidden=false}
</script>"""


def page(numero, contenu, erreur=None):
    etapes = "".join(f'<li class="{"active" if i == numero else ""}">{i}. {html.escape(nom)}</li>'
                     for i, nom in enumerate(ETAPES, start=1))
    alerte = f'<div class="erreur">{html.escape(erreur)}</div>' if erreur else ""
    nom = html.escape(lire_env().get("BOX_NOM", "asoterIA"))
    return f"""<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Installation - {nom}</title>
<style>{STYLE}</style>{SUIVI}</head><body><main>
<h1>Installation d'asoterIA</h1><p class="sous-titre">Quelques étapes, sans connexion à internet. Aucune donnée ne quitte cette machine.</p>
<ol class="etapes">{etapes}</ol>{alerte}{contenu}</main></body></html>"""


def ligne_etat(ok, texte):
    classe, symbole = {True: ("ok", "✓"), False: ("ko", "✗"), None: ("attention", "!")}[ok]
    return f'<li><span class="{classe}">{symbole}</span> {texte}</li>'


def ecran_etat():
    etats = services_demarres()
    attendus = {"proxy": "Reverse proxy TLS", "nextcloud": "Fichiers, agenda, contacts",
                "db": "Base de données", "cache": "Cache", "coffre": "Coffre-fort de mots de passe"}
    libelles = {"healthy": "en service", "running": "démarré", "starting": "en cours de démarrage",
                "unhealthy": "en panne", "exited": "arrêté"}
    lignes = [ligne_etat(etats.get(s) in ("healthy", "running"), f"{nom} : {libelles.get(etats.get(s), 'arrêté')}")
              for s, nom in attendus.items()]
    en_ligne = connecte_a_internet()
    lignes.append(ligne_etat(None if en_ligne else True, "Connexion à internet : " + (
        "présente (la box fonctionne aussi sans, les services n'y ont pas accès)" if en_ligne else "aucune")))
    tout_va_bien = all(etats.get(s) in ("healthy", "running") for s in attendus)
    action = ('<form method="post" action="/etape/1"><button>Commencer</button></form>' if tout_va_bien else
              '<form method="post" action="/installer"><p>Les services ne sont pas tous démarrés.</p>'
              '<button>Installer et démarrer les services</button></form>')
    return page(1, f"""<div class="carte"><h2>État de la box</h2><ul class="etat">{''.join(lignes)}</ul>{action}</div>""")


def ecran_cabinet(erreur=None, saisie=None):
    saisie = {k: html.escape(v) for k, v in (saisie or {}).items()}
    nom = saisie.get("nom") or html.escape(lire_env().get("BOX_NOM", ""))
    return page(2, f"""<form class="carte" method="post" action="/etape/2"><h2>Le cabinet et son administrateur</h2>
<label for="nom">Nom du cabinet</label><input type="text" id="nom" name="nom" required maxlength="60" value="{nom}">
<p class="aide">Affiché sur les pages de la box.</p>
<label for="affichage">Prénom et nom de l'administrateur</label><input type="text" id="affichage" name="affichage" required maxlength="60" placeholder="Me Prénom Nom" value="{saisie.get('affichage', '')}">
<p class="aide">En général l'associé : il crée ensuite les comptes des collaborateurs.</p>
<label for="identifiant">Identifiant de connexion</label><input type="text" id="identifiant" name="identifiant" required pattern="[a-z0-9._-]{{3,32}}" placeholder="pnom" value="{saisie.get('identifiant', '')}">
<label for="courriel">Courriel</label><input type="email" id="courriel" name="courriel" required value="{saisie.get('courriel', '')}">
<label for="mdp">Mot de passe</label><input type="password" id="mdp" name="mdp" required minlength="12" autocomplete="new-password">
<p class="aide">12 caractères au moins. Il n'est enregistré nulle part en clair.</p>
<label for="mdp2">Mot de passe (confirmation)</label><input type="password" id="mdp2" name="mdp2" required minlength="12" autocomplete="new-password">
<button>Créer le compte</button></form>""", erreur)


def ecran_services():
    code, sortie = lancer("docker", "compose", "config", "--services")
    disponibles = set(sortie.split()) if code == 0 else set()
    ia = "assistant" in disponibles
    return page(3, f"""<form class="carte" method="post" action="/etape/3"><h2>Services de la box</h2>
<label class="choix"><input type="checkbox" checked disabled> <span><strong>Fichiers, agenda et contacts</strong><br><span class="aide">Toujours actif.</span></span></label>
<label class="choix"><input type="checkbox" name="coffre" checked> <span><strong>Coffre-fort de mots de passe</strong><br><span class="aide">Compatible avec les applications Bitwarden. L'assistant IA n'y a jamais accès.</span></span></label>
<label class="choix"><input type="checkbox" name="assistant" {"checked" if ia else "disabled"}> <span><strong>Assistant IA local</strong><br><span class="aide">{"Répond à partir des documents du cabinet, en citant ses sources." if ia else "Pas encore installé sur cette box."}</span></span></label>
<label class="choix"><input type="checkbox" name="acces_distant" disabled> <span><strong>Accès distant pour le support</strong><br><span class="aide">Désactivé par défaut. Il s'active plus tard depuis le tableau de bord, et chaque connexion est inscrite au journal.</span></span></label>
<button>Valider les services</button></form>""")


def ecran_securite(erreur=None):
    chiffre, disque = chiffrement_disque()
    etat_disque = ligne_etat(chiffre, {
        True: f"Disque des données chiffré (LUKS) : {html.escape(disque)}",
        False: f"Disque des données NON chiffré : {html.escape(disque)}. Sur une box livrée, le chiffrement est activé à l'installation du système, en atelier.",
        None: "Chiffrement du disque : état inconnu"}[chiffre])
    empreinte = html.escape(empreinte_certificat())
    usb = disques_usb()
    destination = lire_env().get("SAUVEGARDE_DESTINATION", "")
    choix = "".join(f'<label class="choix"><input type="radio" name="destination" value="{html.escape(p)}" {"checked" if p == destination else ""}> '
                    f'<span>{html.escape(n)}<br><span class="aide">{html.escape(p)}</span></span></label>' for p, n in usb)
    choix += (f'<label for="autre">{"Ou un autre dossier" if usb else "Dossier du disque externe"}</label>'
              f'<input type="text" id="autre" name="autre" value="{html.escape(destination if destination not in dict(usb) else "")}" placeholder="/media/sauvegarde">')
    return page(4, f"""<div class="carte"><h2>Chiffrement</h2><ul class="etat">{etat_disque}
{ligne_etat(True, "Connexions chiffrées (TLS) par l'autorité de certification locale de la box")}
{ligne_etat(True, "Sauvegardes chiffrées côté client (restic, AES-256)")}</ul>
<p class="aide">Empreinte du certificat racine, à vérifier sur chaque poste : <code>{empreinte}</code></p></div>
<form class="carte" method="post" action="/etape/4"><h2>Première sauvegarde</h2>
<p>Brancher le disque externe de sauvegarde, puis le choisir.</p>{choix}
<button>Lancer la première sauvegarde</button></form>""", erreur)


def ecran_tache(numero, titre, identifiant, suite):
    return page(numero, f"""<div class="carte"><h2>{html.escape(titre)}</h2><pre id="journal">…</pre><div id="resultat"></div>
<div id="suite" hidden>{suite}</div></div><script>suivre('{identifiant}')</script>""")


def ecran_fiche():
    env, etat = lire_env(), lire_etat()
    domaine = html.escape(env.get("BOX_DOMAIN", ""))
    lignes = [("Cabinet", html.escape(env.get("BOX_NOM", ""))),
              ("Date d'installation", html.escape(etat.get("termine_le", datetime.now().strftime("%d/%m/%Y %H:%M")))),
              ("Administrateur", html.escape(etat.get("administrateur", ""))),
              ("Adresse de la box", f"https://{domaine}"),
              ("Fichiers et agenda", f"https://cloud.{domaine}"),
              ("Coffre-fort", f"https://coffre.{domaine}"),
              ("Empreinte du certificat racine", f"<code>{html.escape(empreinte_certificat())}</code>"),
              ("Dossier de sauvegarde", html.escape(env.get("SAUVEGARDE_DESTINATION", ""))),
              ("Phrase de passe des sauvegardes", f"<code>{html.escape(env.get('SAUVEGARDE_MOT_DE_PASSE', ''))}</code>")]
    tableau = "".join(f"<tr><td>{a}</td><td>{b}</td></tr>" for a, b in lignes)
    return page(5, f"""<div class="carte"><h2>Fiche de secours</h2>
<p><strong>À imprimer et à ranger dans le coffre du cabinet, pas sur la box.</strong> Sans la phrase de passe des sauvegardes,
personne ne peut les relire, y compris nous : c'est ce qui garantit que les dossiers restent au cabinet.</p>
<table class="fiche">{tableau}</table>
<button class="pas-imprimer" onclick="window.print()">Imprimer la fiche</button>
<p class="pas-imprimer aide">L'installation est terminée. Vous pouvez fermer cette page : l'assistant s'arrête de lui-même.</p></div>""")


# ---------------------------------------------------------------- actions

def creer_administrateur(formulaire):
    nom = formulaire.get("nom", "").strip()
    affichage = formulaire.get("affichage", "").strip()
    identifiant = formulaire.get("identifiant", "").strip()
    courriel = formulaire.get("courriel", "").strip()
    mdp = formulaire.get("mdp", "")
    if not all((nom, affichage, identifiant, courriel, mdp)):
        return "Tous les champs sont obligatoires."
    if not re.fullmatch(r"[a-z0-9._-]{3,32}", identifiant):
        return "Identifiant : 3 à 32 caractères parmi a-z, 0-9, point, tiret, tiret bas."
    if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", courriel):
        return "Courriel invalide."
    if mdp != formulaire.get("mdp2", ""):
        return "Les deux mots de passe sont différents."
    if len(mdp) < 12:
        return "Le mot de passe doit faire au moins 12 caractères."
    try:
        ecrire_env("BOX_NOM", nom)
    except ValueError:
        return "Le nom du cabinet contient un caractère non autorisé."
    occ("theming:config", "name", nom)
    for groupe in ("cabinet", "associes"):
        occ("group:add", groupe)
    code, sortie = occ("user:add", "--password-from-env", "--display-name", affichage,
                       "--group", "admin", "--group", "associes", "--group", "cabinet", identifiant,
                       env={"OC_PASS": mdp})
    if code != 0:
        return f"Nextcloud a refusé la création du compte : {sortie.splitlines()[-1] if sortie else 'erreur inconnue'}"
    occ("user:setting", identifiant, "settings", "email", courriel)
    occ("user:setting", identifiant, "core", "lang", "fr")
    code, sortie = lancer("docker", "compose", "run", "--rm", "-T", "outils", "/outils/inviter_coffre.py", courriel)
    ecrire_etat(cabinet=nom, administrateur=f"{affichage} ({identifiant})", courriel=courriel)
    journal("installation", f"compte administrateur {identifiant} créé ; coffre-fort : {sortie.splitlines()[-1] if sortie else '?'}")
    return None


def appliquer_services(formulaire):
    coffre = "coffre" in formulaire
    if coffre:
        lancer("docker", "compose", "up", "-d", "coffre")
    else:
        lancer("docker", "compose", "stop", "coffre")
    choix = {"coffre": coffre, "assistant": "assistant" in formulaire, "acces_distant": False}
    ecrire_etat(services=choix)
    journal("installation", "services : " + ", ".join(f"{k}={'oui' if v else 'non'}" for k, v in choix.items()))


def choisir_destination(formulaire):
    destination = (formulaire.get("autre") or formulaire.get("destination") or "").strip()
    if not destination.startswith("/"):
        return "Indiquer un dossier en chemin absolu, par exemple /media/sauvegarde."
    if not Path(destination).is_dir():
        return f"Dossier introuvable : {destination}. Le disque est-il branché et monté ?"
    try:
        ecrire_env("SAUVEGARDE_DESTINATION", destination)
    except ValueError:
        return "Chemin non autorisé."
    journal("installation", f"destination de sauvegarde : {destination}")
    return None


# ---------------------------------------------------------------- serveur

class Assistant(BaseHTTPRequestHandler):
    server_version = "assistant-box"

    def log_message(self, format, *args):
        pass

    def autorise(self):
        parametres = urllib.parse.parse_qs(urllib.parse.urlsplit(self.path).query)
        if parametres.get("jeton", [""])[0] == JETON:
            return "nouveau"
        biscuits = cookies.SimpleCookie(self.headers.get("Cookie", ""))
        return "ok" if "jeton" in biscuits and secrets.compare_digest(biscuits["jeton"].value, JETON) else None

    def repondre(self, corps, type_contenu="text/html; charset=utf-8", statut=200, entetes=None):
        donnees = corps.encode("utf-8") if isinstance(corps, str) else corps
        self.send_response(statut)
        self.send_header("Content-Type", type_contenu)
        self.send_header("Content-Length", str(len(donnees)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Frame-Options", "DENY")
        for cle, valeur in (entetes or {}).items():
            self.send_header(cle, valeur)
        self.end_headers()
        self.wfile.write(donnees)

    def rediriger(self, cible, entetes=None):
        self.send_response(303)
        self.send_header("Location", cible)
        for cle, valeur in (entetes or {}).items():
            self.send_header(cle, valeur)
        self.end_headers()

    def do_GET(self):
        acces = self.autorise()
        if acces is None:
            return self.repondre("<p>Accès refusé : ouvrir le lien affiché dans le terminal.</p>", statut=403)
        chemin = urllib.parse.urlsplit(self.path).path
        if acces == "nouveau":
            return self.rediriger(chemin, {"Set-Cookie": f"jeton={JETON}; HttpOnly; SameSite=Strict; Path=/"})
        if chemin.startswith("/tache/"):
            tache = TACHES.get(chemin.rsplit("/", 1)[1])
            if not tache:
                return self.repondre("{}", "application/json", 404)
            return self.repondre(json.dumps(tache, ensure_ascii=False), "application/json; charset=utf-8")
        ecrans = {"/": ecran_etat, "/etape/2": ecran_cabinet, "/etape/3": ecran_services,
                  "/etape/4": ecran_securite, "/etape/5": ecran_fiche}
        if chemin in ecrans:
            return self.repondre(ecrans[chemin]())
        self.repondre("<p>Page introuvable.</p>", statut=404)

    def do_POST(self):
        if self.autorise() != "ok":
            return self.repondre("<p>Accès refusé.</p>", statut=403)
        longueur = int(self.headers.get("Content-Length", 0))
        formulaire = {k: v[0] for k, v in urllib.parse.parse_qs(self.rfile.read(longueur).decode("utf-8")).items()}
        chemin = urllib.parse.urlsplit(self.path).path
        if chemin == "/installer":
            identifiant = demarrer_tache("installation", "./box.sh", "installer")
            return self.repondre(ecran_tache(1, "Installation des services", identifiant,
                                             '<a class="bouton" href="/">Continuer</a>'))
        if chemin == "/etape/1":
            return self.rediriger("/etape/2")
        if chemin == "/etape/2":
            erreur = creer_administrateur(formulaire)
            saisie = {k: formulaire.get(k, "") for k in ("nom", "affichage", "identifiant", "courriel")}
            return self.repondre(ecran_cabinet(erreur, saisie)) if erreur else self.rediriger("/etape/3")
        if chemin == "/etape/3":
            appliquer_services(formulaire)
            return self.rediriger("/etape/4")
        if chemin == "/etape/4":
            erreur = choisir_destination(formulaire)
            if erreur:
                return self.repondre(ecran_securite(erreur))
            identifiant = demarrer_tache("sauvegarde", "./box.sh", "sauvegarder")
            suite = ('<form method="post" action="/restauration"><button class="secondaire">Tester aussi la restauration (1 à 2 minutes)</button></form>'
                     '<form method="post" action="/terminer"><button>Terminer</button></form>')
            return self.repondre(ecran_tache(4, "Première sauvegarde chiffrée", identifiant, suite))
        if chemin == "/restauration":
            identifiant = demarrer_tache("restauration", "./box.sh", "tester-restauration")
            return self.repondre(ecran_tache(4, "Test de restauration", identifiant,
                                             '<form method="post" action="/terminer"><button>Terminer</button></form>'))
        if chemin == "/terminer":
            ecrire_etat(termine_le=datetime.now().strftime("%d/%m/%Y %H:%M"))
            journal("installation", "assistant de première configuration terminé")
            threading.Timer(600, lambda: os._exit(0)).start()
            return self.rediriger("/etape/5")
        self.repondre("<p>Action inconnue.</p>", statut=404)


def main():
    if not ENV.exists():
        sys.exit("Fichier .env absent : lancer d'abord ./box.sh installer")
    if lire_etat().get("termine_le") and "--forcer" not in sys.argv:
        sys.exit("L'installation est déjà terminée. Relancer avec --forcer pour la refaire.")
    arguments = [a for a in sys.argv[1:] if not a.startswith("--")]
    adresse = arguments[0] if arguments else "127.0.0.1"
    port = int(arguments[1]) if len(arguments) > 1 else 8090
    serveur = ThreadingHTTPServer((adresse, port), Assistant)
    hote = "127.0.0.1" if adresse in ("0.0.0.0", "") else adresse
    print(f"Assistant d'installation : http://{hote}:{port}/?jeton={JETON}", flush=True)
    print("Ce lien donne accès à l'installation : ne pas le partager. Ctrl+C pour arrêter.", flush=True)
    try:
        serveur.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
