"""Pack juridique de la box : textes de loi et jurisprudence français, stockés sur la box et interrogeables
hors ligne, avec en option une recherche en ligne par les API officielles (Légifrance, Judilibre).

Bibliothèque standard uniquement (sqlite3 avec FTS5, xml.etree, tarfile, urllib).

- dila.py : lecture des archives ouvertes de la DILA (LEGI, CASS, INCA, CAPP, JADE) ;
- base.py : base SQLite de la box (articles avec toutes leurs versions, décisions, liens entre les deux) ;
- references.py : repérage des références juridiques dans un texte (« art. L. 1234-9 C. trav. », « n° 19-20.123 ») ;
- recherche.py : choix des textes et des décisions à donner au modèle pour une question ;
- telechargement.py : mise à jour depuis le site de la DILA (connexion sortante inscrite au journal) ;
- en_ligne.py : passerelle vers les API Légifrance et Judilibre (désactivée sans identifiants PISTE).
"""
