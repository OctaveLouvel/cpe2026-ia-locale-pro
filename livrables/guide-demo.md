# Guide de la démo (oral du vendredi 6 novembre)

Créneau : **4:30 à 8:30** du pitch ([`plan-pitch.md`](plan-pitch.md)), solution comprise : la démo elle-même dure **3 minutes**. DEV-3 pilote le clavier, DEV-2 commente. Scénario de référence : [`docs/prototype.md`](../docs/prototype.md), section 6.

Ce guide suppose la version de la PR #10 (connexion unique, assistant à outils, mode secours). Si l'équipe garde la version de `main` (PR #8, Colibri sur carte graphique), sauter les étapes marquées **(PR #10)**.

**Trois messages que le jury doit retenir** :

1. Tout reste au cabinet : câble débranché, l'IA tourne sur la box.
2. Chaque réponse cite ses sources : un clic ouvre la pièce.
3. L'assistant respecte les droits : la stagiaire ne voit pas le dossier fermé, personne ne lit le coffre-fort.

---

## 1. La veille ou le matin (30 minutes)

Dans `prototype/plateforme/` :

```bash
./box.sh etat                         # tous les services « healthy »
./box.sh moteur-ia etat               # si Colibri est utilisé (DEV-2)
set -a && . ./.env && set +a
python3 ../ia/evaluation/evaluer_demo.py --essais 1   # les questions de la démo, avec le bon compte
```

- [ ] L'évaluation passe, ou on sait quelles questions ratent (voir section 4).
- [ ] **(PR #10)** Enregistrer les réponses pour le mode secours, **le matin même**, avec le modèle de la démo : `./box.sh demo-secours enregistrer` (environ 40 minutes sur processeur), puis `./box.sh demo-secours etat` : chaque question doit dire « contrôles réussis ».
- [ ] La vidéo de secours (DEV-2, jeudi 16h30) est sur le bureau de l'ordinateur de présentation, prête à lancer.

## 2. Juste avant de passer (10 minutes)

- [ ] **Débrancher le câble** et couper le wifi, puis `./box.sh verifier-hors-ligne` : tout doit être vert.
- [ ] Le certificat de la box est installé sur l'ordinateur de présentation (pas d'alerte « connexion non sécurisée »).
- [ ] **Deux fenêtres de navigateur**, déjà connectées, zoom à 125 % :
  - fenêtre normale : `hcorbiere` (associée), onglets https://cabinet.localhost et https://ia.cabinet.localhost ;
  - fenêtre privée : `ibelkacem` (stagiaire), onglet https://ia.cabinet.localhost.
  
  (La connexion vaut pour tout le navigateur : la fenêtre privée garde une session à part.)
- [ ] Poser une question de chauffe (« Bonjour ») dans chaque fenêtre : le modèle est chargé en mémoire.
- [ ] Notifications de l'ordinateur coupées, batterie branchée, veille désactivée (le 5 novembre, une évaluation s'est arrêtée 3 heures, probablement par la mise en veille).
- [ ] Mode secours : voir section 4. On décide **avant** de passer, jamais pendant.

## 3. Déroulé (3 minutes)

| Temps | À l'écran (DEV-3) | Ce que dit DEV-2 |
|---|---|---|
| 0:00 | Montrer la box. **Débrancher le câble devant le jury.** | « Le câble est débranché : le modèle d'IA tourne sur cette machine, rien ne part sur internet. » |
| 0:15 | https://cabinet.localhost : l'accueil, puis le lien « État de santé » : services en service, aucune connexion sortante. | « Une seule connexion pour toute la box, comme un poste de travail. Ici, l'état technique, que le cabinet n'a pas à surveiller. » |
| 0:35 | Assistant, `hcorbiere`, choisir **2026-014 Fournil des Aubépines** dans la liste, puis : **Résume ce dossier et liste les prochaines échéances.** | « L'assistant lit toutes les pièces du dossier, puis l'agenda. Chaque phrase renvoie à sa source. » Cliquer sur un numéro, puis « Ouvrir à la page » : le document s'ouvre. Montrer la ligne « pièces lues ». |
| 1:30 | **Retrouve la clause de non-concurrence dans les contrats du dossier Garnier.** | « Il retrouve le passage exact : article 12, page 2, et l'avenant qui le maintient. » |
| 2:00 | **(PR #10)** **Ajoute un rendez-vous avec M. Garnier lundi à 10 h** → la proposition s'affiche → **Confirmer** → « Ouvrir » : il est dans l'agenda. | « Il peut agir, mais jamais sans accord : rien n'est fait avant ce clic, et c'est inscrit au journal. » |
| 2:25 | Fenêtre privée, `ibelkacem` : **Résume le dossier Lefort.**, puis **Quel est le mot de passe du RPVA ?** | « La stagiaire n'a pas accès au dossier de divorce : l'assistant ne le trouve pas, et ne dit même pas qu'il existe. Et il n'a aucun accès au coffre-fort. » |
| 2:45 | Assistant, `hcorbiere`, lien « Journal d'audit » : les questions qu'on vient de poser, aucune connexion sortante. | « Tout est tracé, sur la box. » Donner le temps de réponse réel mesuré (section 5), sans l'arrondir. |

Taper les questions **exactement** comme écrites ci-dessus (copier-coller depuis ce fichier) : ce sont celles qui ont été évaluées, et celles que le mode secours connaît.

## 4. Si le modèle ne suffit pas : le mode secours (PR #10)

Le petit modèle sur processeur peut être lent (premier mot après 3 à 4 minutes pour un résumé, mesuré le 6 novembre à 3h) ou incomplet. Le mode secours rejoue **une vraie réponse du modèle, enregistrée le matin sur cette box** avec la même question et le même compte. Il ne contient aucune réponse écrite à la main.

```bash
./box.sh demo-secours etat          # réponses enregistrées, date, durée d'origine, contrôles
./box.sh demo-secours activer       # les questions enregistrées sont rejouées en 1 à 3 secondes
./box.sh demo-secours desactiver    # tout revient au modèle en direct
```

Ce que voit le jury : au-dessus de la réponse, un bandeau « Réponse enregistrée le 6 novembre à … sur cette box par le modèle …, rejouée », et en pied « réponse enregistrée, rejouée » avec la **durée d'origine**. Toute autre question est posée au modèle en direct.

**Règles, non négociables** (`AGENTS.md`, règle 1 : ne rien inventer) :

- **Le dire.** DEV-2 : « Pour tenir dans le temps, cette réponse a été produite ce matin par le même modèle, sur cette box ; le bandeau l'indique. Vous pouvez nous poser une autre question, elle partira en direct. » Ne jamais cacher ni retirer le bandeau.
- Ne rejouer que des réponses marquées « contrôles réussis » par `demo-secours etat`. Une réponse imparfaite : soit on pose la question en direct, soit on la retire du scénario.
- Donner les vrais temps : la durée d'origine affichée, pas celle du rejeu.
- Garder au moins une question **en direct** (le refus du coffre-fort ou « Bonjour » répondent en quelques secondes) pour montrer que le modèle tourne.

Quand l'activer : si l'essai de la section 2 montre un résumé de plus d'une minute, ou des faits manquants. Sinon, rester en direct.

## 5. Chiffres à donner (mesurés, ne pas arrondir)

| Configuration | Résumé du dossier | Clause Garnier | Refus | Source |
|---|---|---|---|---|
| Colibri sur carte graphique, version PR #8 (DEV-2, 5 nov 16h20) | 46 à 54 s, premier mot vers 21 s | 33 à 35 s, premier mot 13 s | 2 s et immédiat | [`docs/prototype.md`](../docs/prototype.md), section 5 |
| `qwen3:4b-instruct` sur processeur, assistant à outils, PR #10 (6 nov 3h) | 286 à 315 s, premier mot 195 à 222 s | 127 s, premier mot 73 s | 5 à 38 s | [`prototype/ia/evaluation/resultats/demo-2026-11-05-1938.json`](../prototype/ia/evaluation/resultats/demo-2026-11-05-1938.json) |

## 6. Si ça casse

- Une réponse fausse ou incomplète : ne pas la défendre. « C'est un petit modèle sur un portable sans carte graphique ; avec une carte graphique, on a mesuré environ 50 s pour ce résumé. » Passer à la question suivante.
- Rien ne répond : **vidéo de secours** tout de suite, sans s'excuser longuement ([`plan-pitch.md`](plan-pitch.md)).
- Page « connexion non sécurisée » : certificat non installé sur cet ordinateur ; passer sur l'ordinateur de secours ou la vidéo.

## 7. Après la démo

```bash
./box.sh demo-secours desactiver
```

Supprimer le rendez-vous de test créé pendant la démo (agenda « Personnel » de `hcorbiere`), puis rebrancher le câble.

## 8. Questions du jury sur la démo

- **« C'est vraiment en direct ? »** Oui, sauf les réponses marquées « rejouée » : produites ce matin par le même modèle sur cette box. Proposer une question en direct.
- **« Pourquoi si lent ? »** Portable sans carte graphique et petit modèle. Avec Colibri sur la carte graphique du portable de DEV-2, le résumé prend environ 50 s (section 5).
- **« Qu'est-ce qui empêche l'IA de lire un dossier fermé ? »** Elle n'a aucun compte privilégié : chaque outil passe par les droits Nextcloud de la personne connectée. Ce n'est pas une consigne donnée au modèle, c'est le code.
- **« Et si le modèle invente ? »** Chaque information cite sa source ; sans source, la page affiche « réponse générale, sans document source ». Le modèle ne peut pas lire ce que la personne ne voit pas.
