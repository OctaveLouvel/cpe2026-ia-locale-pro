# Image Nextcloud de la box : Nextcloud 34 + applications Agenda et Contacts intégrées.
# La box s'installe ainsi sans jamais contacter le magasin d'applications de Nextcloud.
# Construite pendant la préparation de la box en atelier (connexion nécessaire une seule fois).
FROM nextcloud:34.0.5-apache

# Versions compatibles avec Nextcloud 34 (magasin d'applications consulté le 3 novembre 2026).
ARG CALENDAR_VERSION=6.6.4
ARG CALENDAR_SHA256=0557b6b5852a467cf3f746e59d56478d227f78bf7a66357b30dfc10cae4c7e3c
ARG CONTACTS_VERSION=8.9.3
ARG CONTACTS_SHA256=2844792ca52f25057ea0ee30b326cc3a63771ab7d82b1e52c39b2e344906ac8c

RUN set -eux; \
    cd /tmp; \
    curl -fsSL -o calendar.tar.gz \
      "https://github.com/nextcloud-releases/calendar/releases/download/v${CALENDAR_VERSION}/calendar-v${CALENDAR_VERSION}.tar.gz"; \
    echo "${CALENDAR_SHA256}  calendar.tar.gz" | sha256sum -c -; \
    curl -fsSL -o contacts.tar.gz \
      "https://github.com/nextcloud-releases/contacts/releases/download/v${CONTACTS_VERSION}/contacts-v${CONTACTS_VERSION}.tar.gz"; \
    echo "${CONTACTS_SHA256}  contacts.tar.gz" | sha256sum -c -; \
    mkdir -p /usr/src/nextcloud/custom_apps; \
    tar -xzf calendar.tar.gz -C /usr/src/nextcloud/custom_apps; \
    tar -xzf contacts.tar.gz -C /usr/src/nextcloud/custom_apps; \
    rm calendar.tar.gz contacts.tar.gz

# Exécuté une seule fois, juste après la première installation (utilisateur www-data).
# (chmod séparé : compatible avec le constructeur classique de Docker, sans BuildKit)
COPY hooks/post-installation/ /docker-entrypoint-hooks.d/post-installation/
RUN chmod 755 /docker-entrypoint-hooks.d/post-installation/*.sh
